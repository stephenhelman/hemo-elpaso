/**
 * R2 settings live in ONE module. Run: npm run check:r2-config   (offline: no DB, no network)
 *  - no bucket, endpoint, account id or media host written anywhere in src/, scripts/ or the build config
 *  - no code reads an R2_* variable except src/lib/r2-config.ts; only src/lib/r2.ts builds a storage client
 *  - the config module throws, naming the variables, when any is missing or blank: no defaults, no fallbacks
 *  - .env.example lists every variable (empty); server start and the production build both check them
 */
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, sep } from "node:path";
import { test } from "node:test";
import { R2_ENV_VARS, R2ConfigError, missingR2Env, readR2Config } from "../src/lib/r2-config";

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
  { name: "R2 variable read outside the config module", re: /\benv\??(?:\.|\[\s*["'`])R2_|\{[^}]*\bR2_[A-Z_]+[^}]*\}\s*=\s*process\.env/ },
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
  const listed = Array.from(example.matchAll(/^#?\s*((?:R2|S3|CLOUDFLARE|CLOUDFRONT)_[A-Z_]+)=/gm), (m) => m[1]);
  assert.deepEqual(listed.sort(), [...R2_ENV_VARS].sort(), "no other storage variable names");
});

test("settings are checked when the server starts and before a production build", () => {
  assert.match(readFileSync("src/instrumentation.ts", "utf8"), /r2Config\(\)/);
  const build = readFileSync("scripts/vercel-build.mjs", "utf8");
  const check = build.indexOf('"scripts/require-r2-env.ts"');
  assert.ok(check > -1 && check < build.indexOf('"migrate", "deploy"'), "checked before migrations run");
});
