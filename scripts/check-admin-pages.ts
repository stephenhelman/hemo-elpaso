/**
 * Admin household pages in a PRODUCTION build. Run: npm run check:admin-pages   (builds first; db-guard refuses production)
 *
 * Why: in `next dev` a server component can call a function exported from a "use client" module and it works; in the
 * production build that export is only a client reference and the page throws "TypeError: (0 , x.y) is not a function".
 * This starts `next start`, signs in as throw-away board people (a forged session cookie, made with the SAME encryption
 * the Auth0 SDK uses and the real AUTH0_SECRET), and fetches the real pages:
 *   - /admin/patients/[id], /admin/patients/new and /admin/review/[id] answer 200 with the page, not an error
 *   - the review page's data route works
 *   - President sees the household's diagnoses (own and members') on the patient page
 *   - a reviewer (Secretary) is turned away from the patient page and its data route carries no diagnoses
 *   - a static scan: no server module calls or reads a value imported from a "use client" module (components as JSX only)
 */
import "./_load-env";
import assert from "node:assert/strict";
import { test, before, after } from "node:test";
import { spawn, type ChildProcess } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import { prisma } from "../src/lib/db";

const require_ = createRequire(join(process.cwd(), "package.json"));
// jose is the Auth0 SDK's own dependency (the session cookie is a JWE made with it)
const { EncryptJWT } = createRequire(join(process.cwd(), "node_modules/@auth0/nextjs-auth0/package.json"))("jose") as { EncryptJWT: new (p: Record<string, unknown>) => { setProtectedHeader(h: Record<string, unknown>): { encrypt(k: Uint8Array): Promise<string> } } };
const { encryption } = require_(join(process.cwd(), "node_modules/@auth0/nextjs-auth0/dist/auth0-session/utils/hkdf.js")) as { encryption: (secret: string) => Promise<Uint8Array> };

const PORT = 3917;
const BASE = `http://localhost:${PORT}`;
const tag = `adm${Date.now()}`;
const domain = process.env.NEXT_PUBLIC_EMAIL_DOMAIN || "hemoelpaso.org";
const patients: string[] = [];
const subs: string[] = [];
let server: ChildProcess | null = null;
let serverLog = "";
let houseId = "";
let legacyId = ""; // a household with a legacy one-line address: the page calls emptyAddress() only for these (and for no address)

async function cookieFor(sub: string, email: string) {
  const key = await encryption(process.env.AUTH0_SECRET!);
  const now = Math.floor(Date.now() / 1000);
  const jwe = await new EncryptJWT({ user: { sub, email, email_verified: true, name: "Check" } })
    .setProtectedHeader({ alg: "dir", enc: "A256GCM", iat: now, uat: now, exp: now + 3600 })
    .encrypt(key);
  return `appSession=${jwe}`;
}
const get = (path: string, cookie: string) => fetch(`${BASE}${path}`, { headers: { cookie }, redirect: "manual" });

async function boardPerson(role: "PRESIDENT" | "SECRETARY") {
  const email = `${tag}.${role.toLowerCase()}@${domain}`;
  const p = await prisma.patient.create({
    data: {
      email, role: "board", reviewStatus: "approved", familySize: 1,
      contactProfile: { create: { firstName: role, lastName: tag } },
      boardRoles: { create: [{ role, assignedBy: "test" }] },
    },
  });
  patients.push(p.id);
  const sub = `google-oauth2|${tag}${role}`;
  subs.push(sub);
  return cookieFor(sub, email);
}

let president = "", secretary = "";

before(async () => {
  assert.ok(existsSync(".next/BUILD_ID"), "no production build: run `npm run build` (npm run check:admin-pages does it)");
  const h = await prisma.patient.create({
    data: {
      email: `${tag}.family@example.org`, role: "patient", source: "web", reviewStatus: "pending_review", familySize: 2,
      primaryDiagnoses: ["hemophilia_b"], statedDiagnoses: ["hemophilia_b", "von_willebrand"],
      contactProfile: { create: { firstName: `Fam${tag}`, lastName: "Household", phone: "+19155550199", addressLine1: "1 Main St", city: "El Paso", state: "TX", zipCode: "79901" } },
      consentRecords: { create: [{ type: "data_and_contact", granted: true, textVersion: "v3", method: "web" }] },
      householdMembers: { create: [{ firstName: "Kid", lastName: "Household", relationship: "child", ageGroup: "6_12", statedDiagnoses: ["von_willebrand"] }] },
    },
  });
  houseId = h.id;
  patients.push(h.id);
  const l = await prisma.patient.create({
    data: {
      email: `${tag}.legacy@example.org`, role: "patient", source: "web", reviewStatus: "approved", familySize: 1,
      contactProfile: { create: { firstName: `Leg${tag}`, lastName: "Household", phone: "+19155550198", addressLine1: "PO Box 12, El Paso TX 79901" } },
      consentRecords: { create: [{ type: "data_and_contact", granted: true, textVersion: "v3", method: "web" }] },
    },
  });
  legacyId = l.id;
  patients.push(l.id);
  president = await boardPerson("PRESIDENT");
  secretary = await boardPerson("SECRETARY");

  server = spawn("npx", ["next", "start", "-p", String(PORT)], { env: { ...process.env, AUTH0_BASE_URL: BASE, PORT: String(PORT) }, stdio: ["ignore", "pipe", "pipe"] });
  server.stdout!.on("data", (d) => (serverLog += d));
  server.stderr!.on("data", (d) => (serverLog += d));
  const until = Date.now() + 60_000;
  for (;;) {
    try { if ((await fetch(`${BASE}/`, { redirect: "manual" })).status < 500) break; } catch { /* not up yet */ }
    if (Date.now() > until) throw new Error(`next start did not come up:\n${serverLog}`);
    await new Promise((r) => setTimeout(r, 500));
  }
});

after(async () => {
  server?.kill("SIGTERM");
  await prisma.userIdentity.deleteMany({ where: { auth0Sub: { in: subs } } });
  await prisma.auditLog.deleteMany({ where: { OR: [{ patientId: { in: patients } }, { resourceId: { in: patients } }] } });
  await prisma.patient.deleteMany({ where: { id: { in: patients } } });
  await prisma.$disconnect();
});

const notBroken = (html: string, where: string) => {
  assert.ok(!/Application error|Internal Server Error|is not a function/i.test(html), `${where}: error page`);
  assert.ok(!/TypeError/.test(serverLog), `${where}: the server logged a TypeError:\n${serverLog.slice(-1500)}`);
};

test("production build: /admin/patients/[id] renders for President, with the household's diagnoses", async () => {
  const res = await get(`/admin/patients/${houseId}`, president);
  const html = await res.text();
  assert.equal(res.status, 200, `status ${res.status}\n${serverLog.slice(-1500)}`);
  notBroken(html, "patients/[id]");
  assert.ok(html.includes(`Fam${tag}`), "the household's name is on the page");
  // PHI is passed to the client form / panel only for people who hold canViewPHI (President and VP do)
  // the page hands the PHI to its client components as props, which appear in the page payload (JSON, quotes escaped)
  const flat = html.replace(/\\"/g, '"');
  assert.ok(flat.includes('"diagnoses":["hemophilia_b"]'), "President sees the primary's own diagnoses");
  assert.ok(flat.includes('"diagnoses":["von_willebrand"]'), "President sees the minor member's diagnoses");
});

test("production build: /admin/patients/[id] renders for a household with a legacy one-line address and for one with no address", async () => {
  const none = await prisma.patient.create({
    data: {
      email: `${tag}.noaddr@example.org`, role: "patient", source: "web", reviewStatus: "approved", familySize: 1,
      contactProfile: { create: { firstName: `Non${tag}`, lastName: "Household", phone: "+19155550197" } },
      consentRecords: { create: [{ type: "data_and_contact", granted: true, textVersion: "v3", method: "web" }] },
    },
  });
  patients.push(none.id);
  for (const [id, name] of [[legacyId, `Leg${tag}`], [none.id, `Non${tag}`]]) {
    const res = await get(`/admin/patients/${id}`, president);
    const html = await res.text();
    assert.equal(res.status, 200, `status ${res.status}\n${serverLog.slice(-1500)}`);
    notBroken(html, "patients/[id] (no structured address)");
    assert.ok(html.includes(name));
  }
});

test("production build: /admin/patients/new renders (it used the same client-module helper)", async () => {
  const res = await get("/admin/patients/new", president);
  const html = await res.text();
  assert.equal(res.status, 200, `status ${res.status}\n${serverLog.slice(-1500)}`);
  notBroken(html, "patients/new");
});

test("production build: /admin/review/[id] renders and its data route answers, without diagnoses", async () => {
  const res = await get(`/admin/review/${houseId}`, president);
  const html = await res.text();
  assert.equal(res.status, 200, `status ${res.status}\n${serverLog.slice(-1500)}`);
  notBroken(html, "review/[id]");
  const api = await get(`/api/admin/review/${houseId}`, president);
  assert.equal(api.status, 200);
  const body = JSON.stringify(await api.json());
  assert.ok(body.includes(`Fam${tag}`));
  assert.ok(!/hemophilia|von_willebrand/.test(body), "the review data carries no diagnoses");
});

test("production build: a reviewer (Secretary) reaches the review page but not the patient page, and sees no diagnoses", async () => {
  const review = await get(`/admin/review/${houseId}`, secretary);
  assert.equal(review.status, 200);
  const api = await get(`/api/admin/review/${houseId}`, secretary);
  assert.equal(api.status, 200);
  assert.ok(!/hemophilia|von_willebrand/.test(JSON.stringify(await api.json())));
  const patient = await get(`/admin/patients/${houseId}`, secretary);
  assert.ok(patient.status >= 300 && patient.status < 400, `redirected away, got ${patient.status}`);
  assert.ok(!(await patient.text()).includes("hemophilia_b"));
});

// ── static: a server module may only render a client component, never call or read a client module's other exports ──
const walk = (dir: string): string[] => readdirSync(dir).flatMap((n) => { const p = join(dir, n); return statSync(p).isDirectory() ? walk(p) : /\.tsx?$/.test(n) ? [p] : []; });
const isClient = (src: string) => /^\s*(?:(?:\/\/[^\n]*|\/\*[\s\S]*?\*\/)\s*)*["']use client["']/.test(src);

test("no server module calls or reads a value exported from a \"use client\" module", () => {
  const files = walk("src");
  const text = new Map(files.map((f) => [f, readFileSync(f, "utf8")]));
  const clientFiles = new Set(files.filter((f) => isClient(text.get(f)!)));
  const resolve = (spec: string, from: string) => {
    const base = spec.startsWith("@/") ? `src/${spec.slice(2)}` : spec.startsWith(".") ? join(from, "..", spec) : null;
    if (!base) return null;
    return [".tsx", ".ts", "/index.tsx", "/index.ts"].map((e) => base + e).find((p) => text.has(p)) ?? null;
  };
  const bad: string[] = [];
  for (const [f, src] of Array.from(text.entries())) {
    if (clientFiles.has(f)) continue;
    for (const m of Array.from(src.matchAll(/import\s+(?!type\b)([^;]*?)\s+from\s+["']([^"']+)["']/g))) {
      const target = resolve(m[2], f);
      if (!target || !clientFiles.has(target)) continue;
      const names = Array.from(m[1].matchAll(/(?:\{([^}]*)\}|^([A-Za-z_$][\w$]*))/g)).flatMap((x) => (x[1] ? x[1].split(",") : [x[2]])).map((n) => n.trim()).filter((n) => n && !n.startsWith("type "));
      for (const raw of names) {
        const name = raw.split(/\s+as\s+/).pop()!.trim();
        if (/^use[A-Z]/.test(name)) continue; // hooks only run inside client trees (e.g. Footer, rendered by a client layout)
        const rest = src.replace(m[0], "");
        // allowed: <Name .../> (a component). Not allowed: Name( ... ), Name.x
        if (new RegExp(`(?<![<\\w.])${name}\\s*\\(`).test(rest) || new RegExp(`(?<![<\\w.])${name}\\.[A-Za-z]`).test(rest)) bad.push(`${f} uses ${name} from ${target}`);
      }
    }
  }
  assert.deepEqual(bad, [], "move these helpers into a module without \"use client\"");
});
