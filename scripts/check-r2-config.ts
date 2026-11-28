/**
 * R2 settings live in ONE module. Run: npm run check:r2-config   (offline: no DB, no network)
 *  - no bucket, endpoint, account id or media host written anywhere in src/, scripts/ or the build config
 *  - no code reads an R2_* variable except src/lib/r2-config.ts; only src/lib/r2.ts builds a storage client
 *  - the config module throws, naming the variables, when any is missing or blank: no defaults, no fallbacks
 *  - the production bucket is refused outside production unless one command opts in, and ALWAYS in a check run
 *  - .env.example lists every variable (empty); a bad setting never stops the server, only the storage routes; the
 *    production build still checks
 */
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, sep } from "node:path";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { test } from "node:test";
import { ALLOW_PROD_VAR, R2_ENV_VARS, R2ConfigError, isCheckRun, isProductionStorage, missingR2Env, readR2Config } from "../src/lib/r2-config";
import { PRODUCTION_STORAGE } from "../src/lib/r2-production";

const CONFIG = "src/lib/r2-config.ts";
const CLIENT = "src/lib/r2.ts";
const SELF = "scripts/check-r2-config.ts"; // holds the sample violations below

interface Rule { name: string; re: RegExp; allow?: string[] }
const RULES: Rule[] = [
  { name: "storage endpoint", re: /r2\.cloudflarestorage\.com|\.amazonaws\.com/i },
  { name: "public bucket or media host", re: /\br2\.dev\b|\bmedia\.hemo-?el-?paso\.org/i },
  { name: "account id or access key (32 hex characters)", re: /(?<![0-9a-f])[0-9a-f]{32}(?![0-9a-f])/i },
  { name: "bucket name", re: /\bbucket(?:_?name)?["']?\s*[:=]\s*(?:["']|`(?!\$\{))/i },
  { name: "bucket name in CopySource", re: /CopySource\s*:\s*(?:["']|`(?!\$\{))/ },
  // check-all.mjs only removes the opt-in from its children's environment (it can't import the TypeScript constant)
  { name: "R2 variable read outside the config module", re: /\benv\??(?:\.|\[\s*["'`])R2_|\{[^}]*\bR2_[A-Z_]+[^}]*\}\s*=\s*process\.env/, allow: ["scripts/check-all.mjs"] },
  { name: "R2 setting exposed to the browser", re: /NEXT_PUBLIC_(?:R2|S3)_/ },
  { name: "storage client built outside lib/r2.ts", re: /new\s+S3Client\s*\(/, allow: [CLIENT] },
];

const violations = (file: string, text: string) =>
  text.split("\n").flatMap((line, i) =>
    RULES.filter((r) => !r.allow?.includes(file) && r.re.test(line)).map((r) => `${file}:${i + 1}  ${r.name}`),
  );

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((n) => (statSync(join(dir, n)).isDirectory() ? walk(join(dir, n)) : [join(dir, n)]));

const scanned = () =>
  [...walk("src"), ...walk("scripts"), "next.config.mjs", "vercel.json"]
    .map((f) => f.split(sep).join("/"))
    .filter((f) => /\.(ts|tsx|js|mjs|cjs|json)$/.test(f) && f !== CONFIG && f !== SELF);

test("nothing outside the config module hard-codes a storage setting or reads one", () => {
  const files = scanned();
  assert.ok(files.length > 100 && files.includes(CLIENT), "the scan covers the source tree");
  const found = files.flatMap((f) => violations(f, readFileSync(f, "utf8")));
  assert.deepEqual(found, [], `\n${found.join("\n")}\nPut storage settings in environment variables and read them through ${CONFIG}.`);
});

test("the rules catch the mistakes they are for", () => {
  const hex = "0123456789abcdef".repeat(2);
  const bad = [
    "const endpoint = `https://${id}.r2.cloudflarestorage.com`;",
    'const url = "https://bucket.s3.amazonaws.com/x";',
    'const base = "https://pub-abc123.r2.dev";',
    'const base = "https://media.hemoelpaso.org";',
    `const accountId = "${hex}";`,
    'new PutObjectCommand({ Bucket: "hoep-media", Key });',
    "const bucketName = 'hoep-media';",
    "const BUCKET = `hoep-media`;",
    'CopySource: "hoep-media/key",',
    'const b = process.env.R2_BUCKET_NAME || "x";',
    'const b = process.env["R2_BUCKET_NAME"];',
    "const { R2_BUCKET_NAME } = process.env;",
    "const b = env?.R2_PUBLIC_URL;",
    "process.env.NEXT_PUBLIC_R2_URL",
    "const s3 = new S3Client({});",
  ];
  for (const line of bad) assert.ok(violations("src/x.ts", line).length > 0, `not caught: ${line}`);

  const fine = [
    "new PutObjectCommand({ Bucket: bucket(), Key: key });",
    "CopySource: `${bucket()}/${key}`,",
    "const bucket = (): string => r2Config().bucket;",
    "// stored URLs were written under the old R2_PUBLIC_URL",
    'const key = "flyers/event/en-flyer.pdf";',
    `const sha256 = "${hex}${hex}";`,
  ];
  for (const line of fine) assert.deepEqual(violations("src/x.ts", line), [], line);
  assert.deepEqual(violations(CLIENT, "new S3Client(connection())"), []);
});

const FULL = { R2_ACCOUNT_ID: "acct123", R2_ACCESS_KEY_ID: "key", R2_SECRET_ACCESS_KEY: "secret", R2_BUCKET_NAME: "a-bucket", R2_PUBLIC_URL: "https://files.example.org/" };

test("config: every value comes from the environment, nothing is defaulted", () => {
  assert.deepEqual(readR2Config(FULL), {
    accountId: "acct123", accessKeyId: "key", secretAccessKey: "secret", bucket: "a-bucket",
    publicUrl: "https://files.example.org", endpoint: "https://acct123.r2.cloudflarestorage.com",
  });
  assert.equal(readR2Config({ ...FULL, R2_BUCKET_NAME: " a-bucket\n" }).bucket, "a-bucket", "a pasted newline is trimmed");
  assert.throws(() => readR2Config({}), (e: Error) => e instanceof R2ConfigError && R2_ENV_VARS.every((n) => e.message.includes(n)));
  for (const name of R2_ENV_VARS) {
    for (const value of [undefined, "", "   "]) {
      const env = { ...FULL, [name]: value };
      assert.deepEqual(missingR2Env(env), [name]);
      assert.throws(() => readR2Config(env), new RegExp(name), `${name}=${JSON.stringify(value)}`);
    }
  }
});

test("config: a URL pasted as the account id, or a public URL without a scheme, is refused without printing the value", () => {
  assert.throws(() => readR2Config({ ...FULL, R2_ACCOUNT_ID: "https://secretish.example" }), (e: Error) => /R2_ACCOUNT_ID/.test(e.message) && !e.message.includes("secretish"));
  assert.throws(() => readR2Config({ ...FULL, R2_PUBLIC_URL: "files.example.org" }), /R2_PUBLIC_URL/);
});

test(".env.example lists every variable, with no value", () => {
  const example = readFileSync(".env.example", "utf8");
  for (const name of R2_ENV_VARS) assert.match(example, new RegExp(`^${name}=$`, "m"), name);
  assert.ok(example.includes(ALLOW_PROD_VAR), "the opt-in is explained");
  const listed = Array.from(example.matchAll(/^#?\s*((?:R2|S3|CLOUDFLARE|CLOUDFRONT)_[A-Z_]+)=/gm), (m) => m[1]);
  assert.deepEqual(listed.sort(), [...R2_ENV_VARS].sort(), "no other storage variable names");
});

// ── the production bucket ────────────────────────────────────────────────────
const sha = (v: string) => createHash("sha256").update(v).digest("hex");
// a stand-in for production: the real names are only recorded as hashes
const PROD = { bucketSha256: sha("live-bucket"), publicHostSha256: sha("files.live.example") };
const live = { ...FULL, R2_BUCKET_NAME: "live-bucket", R2_PUBLIC_URL: "https://files.live.example" };
const refused = (env: Record<string, string | undefined>, why: RegExp) =>
  assert.throws(() => readR2Config(env, PROD), (e: Error) => e instanceof R2ConfigError && /PRODUCTION/.test(e.message) && why.test(e.message) && !e.message.includes("live-bucket"), JSON.stringify(env));

test("production storage is recognised by the bucket name OR the public host", () => {
  assert.equal(isProductionStorage("live-bucket", "https://other.example", PROD), true);
  assert.equal(isProductionStorage("other", "https://Files.Live.Example/path", PROD), true);
  assert.equal(isProductionStorage("hoep-media-dev", "https://dev.files.example", PROD), false);
  for (const h of Object.values(PRODUCTION_STORAGE)) assert.match(h, /^[0-9a-f]{64}$/, "recorded as a SHA-256, never the name");
  assert.equal(isProductionStorage("hoep-media-dev", "https://dev.files.example"), false, "the documented development bucket");
});

test("refused outside production; production itself and one deliberate command are allowed", () => {
  for (const VERCEL_ENV of [undefined, "", "preview", "development"]) refused({ ...live, VERCEL_ENV }, /refused outside production/);
  refused({ ...live, R2_BUCKET_NAME: "renamed" }, /outside production/);
  refused({ ...live, R2_PUBLIC_URL: "https://other.example" }, /outside production/);
  for (const v of ["true", "1", "YES please", ""]) refused({ ...live, [ALLOW_PROD_VAR]: v }, /outside production/);
  assert.equal(readR2Config({ ...live, VERCEL_ENV: "production" }, PROD).bucket, "live-bucket");
  assert.equal(readR2Config({ ...live, [ALLOW_PROD_VAR]: "yes" }, PROD).bucket, "live-bucket");
  assert.equal(readR2Config({ ...FULL, VERCEL_ENV: "preview" }, PROD).bucket, "a-bucket", "any other bucket is fine");
});

test("a check run can never use production storage, whatever else is set", () => {
  const marks: Record<string, string>[] = [{ HOEP_CHECK_RUN: "1" }, { npm_lifecycle_event: "check:all" }, { npm_lifecycle_event: "check:photo-pipeline" }];
  for (const mark of marks) {
    assert.equal(isCheckRun(mark), true);
    refused({ ...live, ...mark, [ALLOW_PROD_VAR]: "yes", VERCEL_ENV: "production" }, /Checks never use the production bucket/);
  }
  for (const other of ["dev", "build", "photos:backfill", undefined]) assert.equal(isCheckRun({ npm_lifecycle_event: other }), false, String(other));
});

test("this run is a check run, and check scripts, however started, are marked as one", () => {
  assert.equal(isCheckRun(process.env), true);
  const loader = readFileSync("scripts/_load-env.ts", "utf8");
  assert.match(loader, /HOEP_CHECK_RUN = "1";\s*delete process\.env\[ALLOW_PROD_VAR\]/);
  const all = readFileSync("scripts/check-all.mjs", "utf8");
  assert.match(all, /HOEP_CHECK_RUN: "1"/);
  assert.match(all, /delete env\.R2_ALLOW_PROD_BUCKET/);
  assert.match(all, /spawnSync\("npm", [^\n]*env \}\)/);
  // started directly (no npm), a check script is still marked, even with the opt-in in the environment
  const env: NodeJS.ProcessEnv = { ...process.env, [ALLOW_PROD_VAR]: "yes" };
  delete env.HOEP_CHECK_RUN;
  delete env.npm_lifecycle_event;
  const probe = spawnSync(process.execPath, ["--import", "tsx", "-e", `process.argv[1] = "/x/scripts/check-probe.ts"; import("./scripts/_load-env.ts").then(() => console.log(JSON.stringify([process.env.HOEP_CHECK_RUN, process.env.${ALLOW_PROD_VAR} ?? null])))`], { encoding: "utf8", env });
  assert.match(probe.stdout, /\["1",null\]/, probe.stderr);
  // every check that can reach storage loads the marker
  for (const f of walk("scripts").filter((f) => /^scripts\/check-[^/]+\.ts$/.test(f.split(sep).join("/")))) {
    const text = readFileSync(f, "utf8");
    if (/from "\.\.\/src\/lib\/(r2"|events\/storage|photos\/(ingest|service|download)|flyers\/upload")/.test(text)) assert.match(text, /import "\.\/_load-env";/, f);
  }
});

test("a bad storage setting stops only the storage routes: the server start logs it and carries on", () => {
  const start = readFileSync("src/instrumentation.ts", "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
  assert.match(start, /try \{\s*readR2Config\(\);[\s\S]*?\} catch \(e\) \{\s*console\.error/);
  assert.ok(!/\bthrow\b/.test(start), "the server start throws nothing itself");
  // every admin route that reaches storage answers 503 first
  const routes = walk("src/app/api").map((f) => f.split(sep).join("/")).filter((f) => f.endsWith("route.ts"));
  const usesStorage = /from "@\/lib\/(r2|photos\/(ingest|service|download)|flyers\/upload)"/;
  const found = routes.filter((f) => usesStorage.test(readFileSync(f, "utf8")));
  assert.equal(found.length, 6, found.join("\n"));
  for (const f of found) assert.ok(readFileSync(f, "utf8").includes("storageUnavailable("), f);
});

test("pending photos are read with presigned addresses; no admin response carries their public address", () => {
  assert.match(readFileSync("src/app/api/admin/events/[id]/photos/[photoId]/image/route.ts", "utf8"), /status: 302,\s*headers: \{ Location: await adminImageUrl\(key\), "Cache-Control": "private, no-store"/);
  for (const f of ["src/app/admin/events/[id]/photos/page.tsx", "src/app/api/admin/events/[id]/photos/route.ts", "src/app/api/admin/events/[id]/photos/process/route.ts", "src/app/api/admin/events/[id]/photos/[photoId]/route.ts"]) {
    assert.ok(readFileSync(f, "utf8").includes("adminPhoto"), f);
  }
  assert.ok(!/NextResponse\.json\(\{ photos? [,}]/.test(["route.ts", "process/route.ts", "[photoId]/route.ts"].map((f) => readFileSync(`src/app/api/admin/events/[id]/photos/${f}`, "utf8")).join("")), "no raw row is returned");
});

test("the production build still checks the settings, before migrations", () => {
  const build = readFileSync("scripts/vercel-build.mjs", "utf8");
  const check = build.indexOf('"scripts/require-r2-env.ts"');
  assert.ok(check > -1 && check < build.indexOf('"migrate", "deploy"'), "checked before migrations run");
});
