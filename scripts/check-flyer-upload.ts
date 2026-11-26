/**
 * Saving a flyer: presign -> PUT straight to storage -> finalize -> database. Run: npm run check:flyer-upload
 * (db-guard refuses production)
 *  - the event row is written only after the upload is confirmed in storage; the old file goes only after the row
 *  - every failure is logged with its step and reaches the screen as a message
 *  - end to end against the REAL R2 bucket and the dev database with a file larger than Vercel's 4.5 MB request
 *    limit; the throw-away event and its files are deleted afterwards
 */
import "./_load-env";
import assert from "node:assert/strict";
import { after, test } from "node:test";
import { prisma } from "../src/lib/db";
import { deleteEventStorage } from "../src/lib/events/storage";
import { headR2 } from "../src/lib/r2";
import { finalizeFlyers, flyerDeps, flyerKeyFromUrl, isFlyerTmpKeyFor, newFlyerTmpKey, presignFlyers, type FlyerChanges, type FlyerDeps, type FlyerRow } from "../src/lib/flyers/upload";
import { FlyerUploadError, saveFlyers } from "../src/lib/flyers/upload-client";
import { logFlyerFailure } from "../src/lib/flyers/log";
import { isTmpKeyFor, newTmpKey } from "../src/lib/photos/keys";

const logged: string[] = [];
console.error = (...args: unknown[]) => { logged.push(args.map((a) => (typeof a === "string" ? a : JSON.stringify(a))).join(" ")); };
const loggedStep = (step: string) => logged.some((l) => l.startsWith(`[flyers] ${step} failed`));

const OLD = "https://old-host.example/flyers/e1/1-en-old.pdf";

/** In-memory storage and database that record the order of everything done to them. */
function fake(over: { uploaded?: Record<string, { size: number; contentType: string }>; copyFails?: string; saveFails?: boolean; findFails?: boolean; signFails?: boolean; row?: FlyerRow | null } = {}) {
  const objects = new Map(Object.entries(over.uploaded ?? {}));
  const ops: string[] = [];
  const saved: FlyerChanges[] = [];
  const removed: string[] = [];
  const deps: FlyerDeps = {
    storage: {
      presignPut: async (key) => { if (over.signFails) throw new Error("signing broke"); return `https://storage.example/${key}?sig=1`; },
      head: async (key) => objects.get(key) ?? null,
      copy: async (from, to) => {
        if (over.copyFails && to.includes(over.copyFails)) throw Object.assign(new Error("denied"), { name: "AccessDenied" });
        ops.push("copy"); objects.set(to, objects.get(from)!);
      },
      remove: async (keys) => { ops.push("remove"); removed.push(...keys); keys.forEach((k) => objects.delete(k)); },
      publicUrl: (key) => `https://files.example/${key}`,
    },
    store: {
      find: async () => { if (over.findFails) throw new Error("db down"); return over.row === undefined ? { flyerEnUrl: OLD, flyerEsUrl: null } : over.row; },
      save: async (_id, data) => { ops.push("save"); if (over.saveFails) throw new Error("write refused for https://files.example/secret"); saved.push(data); },
    },
  };
  return { deps, ops, saved, removed, objects };
}

const PDF = { size: 6_000_000, contentType: "application/pdf" };
const en = newFlyerTmpKey("e1");
const es = newFlyerTmpKey("e1");
const both = { flyerEn: { key: en, name: "Picnic.pdf" }, flyerEs: { key: es, name: "Día.pdf" } };

test("keys: flyer uploads and photo uploads cannot be passed off as each other, or moved between events", () => {
  assert.ok(isFlyerTmpKeyFor("e1", en));
  assert.ok(!isFlyerTmpKeyFor("e2", en));
  assert.ok(!isTmpKeyFor("e1", en));
  assert.ok(!isFlyerTmpKeyFor("e1", newTmpKey("e1")));
  assert.ok(!isFlyerTmpKeyFor("e1", `${en}/../x`));
  assert.equal(flyerKeyFromUrl("e1", OLD), "flyers/e1/1-en-old.pdf", "found whatever host it was saved under");
  assert.equal(flyerKeyFromUrl("e1", "https://x.example/photos/e1/a.webp"), null);
  assert.equal(flyerKeyFromUrl("e1", "not a url"), null);
});

test("finalize: confirm and copy, then write the row, then delete the old file and the temporary uploads", async () => {
  const f = fake({ uploaded: { [en]: PDF } });
  const r = await finalizeFlyers("e1", { flyerEn: { key: en, name: "Summer Picnic" }, flyerEnAlt: "  a   flyer " }, f.deps);
  assert.ok(r.ok);
  assert.deepEqual(f.ops, ["copy", "save", "remove", "remove"]);
  assert.match(f.saved[0].flyerEnUrl!, /^https:\/\/files\.example\/flyers\/e1\/\d+-en-summer-picnic\.pdf$/, "extension follows the content type");
  assert.equal(f.saved[0].flyerEnAlt, "a flyer");
  assert.ok(!("flyerEsUrl" in f.saved[0]) && !("flyerEsAlt" in f.saved[0]), "the other language is untouched");
  assert.deepEqual(f.removed, ["flyers/e1/1-en-old.pdf", en]);
});

test("finalize: no upload in storage, a bad object, or a failed copy -> the row is never written", async () => {
  const cases: [string, Parameters<typeof fake>[0], number][] = [
    ["never arrived", {}, 409],
    ["too large", { uploaded: { [en]: { size: 11 * 1024 * 1024, contentType: "application/pdf" } } }, 422],
    ["wrong type", { uploaded: { [en]: { size: 10, contentType: "text/html" } } }, 422],
    ["copy refused", { uploaded: { [en]: PDF }, copyFails: "-en-" }, 502],
  ];
  for (const [name, setup, status] of cases) {
    logged.length = 0;
    const f = fake(setup);
    const r = await finalizeFlyers("e1", { flyerEn: { key: en, name: "a.pdf" } }, f.deps);
    assert.ok(!r.ok && r.status === status && r.step === "finalize" && /English flyer/.test(r.error), name);
    assert.equal(f.saved.length, 0, name);
    assert.ok(!f.removed.includes("flyers/e1/1-en-old.pdf"), `${name}: the current flyer stays`);
    assert.ok(loggedStep("finalize"), `${name} is logged`);
  }
});

test("finalize: if the second file fails, the first copy is removed and nothing is saved", async () => {
  const f = fake({ uploaded: { [en]: PDF } }); // the Spanish file never arrived
  const r = await finalizeFlyers("e1", both, f.deps);
  assert.ok(!r.ok && /Spanish flyer/.test(r.error));
  assert.equal(f.saved.length, 0);
  assert.ok(f.removed.some((k) => /^flyers\/e1\/\d+-en-picnic\.pdf$/.test(k)));
});

test("finalize: database failures are step 'db', logged without URLs, and keep the current flyer", async () => {
  for (const setup of [{ saveFails: true }, { findFails: true }]) {
    logged.length = 0;
    const f = fake({ uploaded: { [en]: PDF }, ...setup });
    const r = await finalizeFlyers("e1", { flyerEn: { key: en, name: "a.pdf" } }, f.deps);
    assert.ok(!r.ok && r.step === "db" && r.status === 500);
    assert.ok(loggedStep("db"));
    assert.ok(!logged.join().includes("https://"), "no URL in the log");
    assert.ok(!f.removed.includes("flyers/e1/1-en-old.pdf"));
  }
});

test("finalize: rejects foreign keys, an empty request and a stale multipart page; alt text saves on its own", async () => {
  for (const body of [null, {}, { flyerEn: { key: newTmpKey("e1") } }, { flyerEn: { key: newFlyerTmpKey("e2") } }]) {
    logged.length = 0;
    const f = fake();
    const r = await finalizeFlyers("e1", body, f.deps);
    assert.ok(!r.ok && r.status === 400 && f.saved.length === 0);
    assert.ok(loggedStep("finalize"));
  }
  const f = fake();
  assert.ok((await finalizeFlyers("e1", { flyerEsAlt: "hola" }, f.deps)).ok);
  assert.deepEqual(f.saved, [{ flyerEsAlt: "hola" }]);
});

test("presign: validates, and logs both refusals and signing failures", async () => {
  const ok = await presignFlyers("e1", { files: [{ lang: "en", type: "application/pdf", size: PDF.size }] }, fake().deps);
  assert.ok(ok.ok && isFlyerTmpKeyFor("e1", ok.uploads[0].key) && ok.uploads[0].headers["Content-Type"] === "application/pdf");
  const bad: [unknown, Parameters<typeof fake>[0], number][] = [
    [{ files: [] }, {}, 400],
    [{ files: [{ lang: "en", type: "image/gif", size: 1 }] }, {}, 400],
    [{ files: [{ lang: "en", type: "image/png", size: 11 * 1024 * 1024 }] }, {}, 400],
    [{ files: [{ lang: "en", type: "image/png", size: 1 }, { lang: "en", type: "image/png", size: 1 }] }, {}, 400],
    [{ files: [{ lang: "en", type: "image/png", size: 1 }] }, { row: null }, 404],
    [{ files: [{ lang: "en", type: "image/png", size: 1 }] }, { signFails: true }, 500],
  ];
  for (const [body, setup, status] of bad) {
    logged.length = 0;
    const r = await presignFlyers("e1", body, fake(setup).deps);
    assert.ok(!r.ok && r.status === status, JSON.stringify(body));
    assert.ok(loggedStep("presign"));
  }
});

test("log: one shape, step and error, with URLs removed", () => {
  logged.length = 0;
  logFlyerFailure("upload", { eventId: "e1", lang: "en" }, new Error("PUT https://x.example/k?X-Amz-Signature=abc failed"));
  assert.match(logged[0], /^\[flyers\] upload failed .*"eventId":"e1".*Error: PUT \[url\] failed/);
});

// ── browser side ─────────────────────────────────────────────────────────────
const file = new File([new Uint8Array(32)], "flyer.pdf", { type: "application/pdf" });
const reply = (body: unknown, status = 200) => new Response(typeof body === "string" ? body : JSON.stringify(body), { status });

function browser(over: { presign?: () => Response; put?: () => Response; finalize?: () => Response }) {
  const calls: { url: string; init: RequestInit }[] = [];
  const doFetch = (async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    if (init.method === "PUT") return (over.put ?? (() => reply("")))();
    if (url.endsWith("/client-error")) return new Response(null, { status: 204 });
    if (url.endsWith("/presign")) return (over.presign ?? (() => reply({ success: true, uploads: [{ lang: "en", key: en, url: "https://storage.example/put", headers: {} }] })))();
    return (over.finalize ?? (() => reply({ success: true, flyerEnUrl: "u", flyerEsUrl: null })))();
  }) as typeof fetch;
  const reports = () => calls.filter((c) => c.url.endsWith("/client-error")).map((c) => JSON.parse(c.init.body as string));
  const finalized = () => calls.some((c) => c.url === "/api/admin/events/e1/flyers");
  const run = () => saveFlyers("e1", { files: { en: file }, alt: { en: "", es: "" } }, doFetch);
  return { run, calls, reports, finalized };
}

const rejects = (p: Promise<unknown>, step: string, message: RegExp) =>
  assert.rejects(p, (e: unknown) => e instanceof FlyerUploadError && e.step === step && message.test(e.message));

test("browser: the file goes only to storage, never to our own server", async () => {
  const b = browser({});
  await b.run();
  const withFile = b.calls.filter((c) => typeof c.init.body !== "string");
  assert.deepEqual(withFile.map((c) => [c.init.method, c.url]), [["PUT", "https://storage.example/put"]]);
});

test("browser: a refused or unreachable storage upload shows an error, tells the server, and never finalizes", async () => {
  const refused = browser({ put: () => reply("<Error><Code>AccessDenied</Code></Error>", 403) });
  await rejects(refused.run(), "upload", /HTTP 403, AccessDenied/);
  assert.deepEqual(refused.reports(), [{ step: "upload", lang: "en", httpStatus: 403, message: "storage refused the file: AccessDenied" }]);
  assert.ok(!refused.finalized());

  const blocked = browser({ put: () => { throw new TypeError("Failed to fetch"); } });
  await rejects(blocked.run(), "upload", /CORS/);
  assert.match(blocked.reports()[0].message, /Failed to fetch/);
  assert.ok(!blocked.finalized());
});

test("browser: server errors, platform error pages and non-JSON replies are all shown", async () => {
  await rejects(browser({ presign: () => reply({ error: "Event not found" }, 404) }).run(), "presign", /Event not found/);
  const platform = browser({ finalize: () => reply("Request Entity Too Large", 413) });
  await rejects(platform.run(), "finalize", /HTTP 413/);
  assert.equal(platform.reports()[0].httpStatus, 413);
  await rejects(browser({ finalize: () => reply("<html>sign in</html>", 200) }).run(), "finalize", /HTTP 200/);
  await rejects(browser({ presign: () => reply({ error: "Unauthorized" }, 401) }).run(), "presign", /sign-in expired/);
});

// ── end to end: real R2 + dev database ───────────────────────────────────────
const events: string[] = [];
after(async () => {
  for (const id of events) await deleteEventStorage(id);
  await prisma.event.deleteMany({ where: { id: { in: events } } });
  await prisma.$disconnect();
});

test("real storage: a 6 MB flyer is saved, is public, and replacing it removes the old file", async () => {
  const event = await prisma.event.create({
    data: { slug: `zz-flyer-check-${Date.now()}`, titleEn: "zz flyer upload check", titleEs: "zz flyer upload check", eventDate: new Date(), location: "test", createdBy: "check-flyer-upload", status: "draft" },
  });
  events.push(event.id);

  // Our two API routes call these functions; the PUT is the same request a browser makes.
  const doFetch = (async (url: string, init: RequestInit) => {
    if (init.method === "PUT") return fetch(url, init);
    if (url.endsWith("/client-error")) return new Response(null, { status: 204 });
    const body = JSON.parse(init.body as string);
    const r = url.endsWith("/presign") ? await presignFlyers(event.id, body, flyerDeps) : await finalizeFlyers(event.id, body, flyerDeps);
    return r.ok ? reply({ ...r, success: true }) : reply({ error: r.error }, r.status);
  }) as typeof fetch;

  const pdf = (mb: number) => {
    const bytes = new Uint8Array(mb * 1024 * 1024);
    bytes.set(new TextEncoder().encode("%PDF-1.4\n"));
    return new File([bytes], "Check Flyer.pdf", { type: "application/pdf" });
  };

  const first = await saveFlyers(event.id, { files: { en: pdf(6) }, alt: { en: "check", es: "" } }, doFetch);
  const row = await prisma.event.findUniqueOrThrow({ where: { id: event.id } });
  assert.equal(row.flyerEnUrl, first.flyerEnUrl);
  assert.equal(row.flyerEnAlt, "check");
  const firstKey = flyerKeyFromUrl(event.id, first.flyerEnUrl!)!;
  assert.equal((await headR2(firstKey))?.size, 6 * 1024 * 1024);
  assert.equal((await fetch(first.flyerEnUrl!, { method: "HEAD", cache: "no-store" })).status, 200, "served on the public URL");

  const second = await saveFlyers(event.id, { files: { en: pdf(1) }, alt: { en: "check", es: "" } }, doFetch);
  assert.notEqual(second.flyerEnUrl, first.flyerEnUrl);
  assert.equal(await headR2(firstKey), null, "the replaced file is gone");

  // A confirmed-missing upload leaves the row alone.
  const r = await finalizeFlyers(event.id, { flyerEn: { key: newFlyerTmpKey(event.id), name: "x.pdf" } }, flyerDeps);
  assert.ok(!r.ok && r.status === 409);
  assert.equal((await prisma.event.findUniqueOrThrow({ where: { id: event.id } })).flyerEnUrl, second.flyerEnUrl);
});
