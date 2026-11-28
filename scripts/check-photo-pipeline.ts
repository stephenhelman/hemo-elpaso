/**
 * The gallery upload pipeline against a DEVELOPMENT R2 bucket and the dev database.
 *
 *   npm run check:photo-pipeline -- <outDir>
 *
 * Builds a ~12 MB phone-style JPEG (EXIF orientation 6 + GPS), then: presigned PUT into uploads/tmp/ (plain fetch, the
 * same request a browser makes) -> ingest -> checks -> approve/unapprove moves -> deletes everything it created.
 * A photo that isn't approved is read the way the admin page reads it: a presigned address (lib/photos/download.ts),
 * never the public domain. Writes input.jpg and the stored files into <outDir> so `exiftool` can be run on them.
 * Never touches production storage: without a development bucket (docs/STORAGE.md) only the first, offline part runs.
 * Refuses to run against the production database (db-guard).
 */
import "./_load-env";
import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import sharp from "sharp";
import { PrismaClient } from "@prisma/client";
import { presignPut, headR2, deleteManyFromR2 } from "../src/lib/r2";
import { newTmpKey } from "../src/lib/photos/keys";
import { ingestTmpUpload } from "../src/lib/photos/ingest";
import { moveToVisibility, deletePhotoObjects } from "../src/lib/photos/service";
import { adminImagePath, adminPhoto } from "../src/lib/photos/admin-view";
import { ADMIN_IMAGE_TTL_SECONDS, adminImageUrl } from "../src/lib/photos/download";
import { r2Config } from "../src/lib/r2-config";
import { storageSkipReason } from "./_storage";

const prisma = new PrismaClient();
let failed = 0;
const check = (name: string, ok: boolean, extra = "") => {
  if (!ok) failed++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${extra ? `  (${extra})` : ""}`);
};
const status = async (url: string) => (await fetch(url, { method: "HEAD", cache: "no-store" })).status;

/** Offline: what the browser is given for a photo that isn't approved. */
function checkAdminView() {
  const row = { id: "p1", eventId: "e1", url: "https://files.example/photos-pending/e1/a.webp", thumbUrl: "https://files.example/photos-pending/e1/a-t.webp", caption: null, captionEs: null, approved: false, width: 1, height: 1 };
  const pending = adminPhoto(row);
  check("pending photo: the admin page gets our own route, no storage address", pending.url === adminImagePath("e1", "p1", "main") && pending.thumbUrl === adminImagePath("e1", "p1", "thumb") && !JSON.stringify(pending).includes("files.example"));
  check("approved photo: its public address", adminPhoto({ ...row, approved: true }).url === row.url);
}

async function main() {
  checkAdminView();
  const skip = storageSkipReason("check:photo-pipeline");
  if (skip) {
    console.log(`SKIP  storage tests: ${skip}`);
    process.exit(failed === 0 ? 0 : 1);
  }
  const out = process.argv[2];
  if (!out) throw new Error("usage: check-photo-pipeline <outDir>");
  mkdirSync(out, { recursive: true });

  // 4400x3300 gaussian noise at q95 is ~12+ MB; the "camera" says rotate 90deg and stamps GPS (El Paso).
  const noise = await sharp({ create: { width: 4400, height: 3300, channels: 3, background: "#808080", noise: { type: "gaussian", mean: 128, sigma: 60 } } }).raw().toBuffer();
  const jpeg = await sharp(noise, { raw: { width: 4400, height: 3300, channels: 3 } })
    .withExif({
      IFD0: { Make: "TestCam", Model: "Phone 15", Software: "check-photo-pipeline" },
      IFD3: { GPSLatitudeRef: "N", GPSLatitude: "31/1 45/1 20/1", GPSLongitudeRef: "W", GPSLongitude: "106/1 29/1 10/1" },
    })
    .withMetadata({ orientation: 6 }) // keeps the EXIF above and adds Orientation=6 (what a portrait phone shot carries)
    .jpeg({ quality: 95 })
    .toBuffer();
  writeFileSync(join(out, "input.jpg"), jpeg);
  console.log(`input.jpg ${(jpeg.length / 1048576).toFixed(1)} MB`);
  check("input is ~12 MB or more", jpeg.length >= 11.5 * 1048576, `${(jpeg.length / 1048576).toFixed(1)} MB`);

  const event = await prisma.event.create({
    data: { slug: `zz-photo-check-${Date.now()}`, titleEn: "zz photo pipeline check", titleEs: "zz photo pipeline check", eventDate: new Date(), location: "test", createdBy: "check-photo-pipeline", status: "draft" },
  });
  const created: { key: string; thumbKey: string | null }[] = [];
  let tmpKey = "";
  try {
    // 1. presign + direct PUT, exactly like the browser
    tmpKey = newTmpKey(event.id);
    const url = await presignPut(tmpKey, "image/jpeg", jpeg.length, 300);
    const put = await fetch(url, { method: "PUT", headers: { "Content-Type": "image/jpeg" }, body: new Uint8Array(jpeg) });
    check("presigned PUT accepted", put.ok, `HTTP ${put.status}`);
    check("original is in uploads/tmp/", (await headR2(tmpKey))?.size === jpeg.length);

    // a PUT with a different length must be refused by the signature
    const badKey = newTmpKey(event.id);
    const badUrl = await presignPut(badKey, "image/jpeg", 10, 300);
    const bad = await fetch(badUrl, { method: "PUT", headers: { "Content-Type": "image/jpeg" }, body: new Uint8Array(50) });
    check("PUT with the wrong size is refused", !bad.ok, `HTTP ${bad.status}`);
    await deleteManyFromR2([badKey]);

    // 2. ingest
    const r = await ingestTmpUpload(event.id, tmpKey, "check-photo-pipeline");
    check("ingest ok", r.ok, r.ok ? "" : r.error);
    if (!r.ok) return;
    const p = r.photo;
    created.push({ key: p.key, thumbKey: p.thumbKey });
    check("photo starts unapproved", p.approved === false);
    check("tmp original deleted", (await headR2(tmpKey)) === null);
    check("stored in the pending area, random key", p.key.startsWith(`photos-pending/${event.id}/`) && /[0-9a-f-]{36}\.webp$/.test(p.key), p.key);
    const orient = await sharp(jpeg).metadata();
    check("source really was rotated 90deg + GPS-tagged", orient.orientation === 6 && !!orient.exif, `orientation ${orient.orientation}`);
    check("stored dimensions are portrait (rotation applied to pixels)", (p.width ?? 0) < (p.height ?? 0), `${p.width}x${p.height}`);
    check("full image is <= 1920px", Math.max(p.width ?? 0, p.height ?? 0) <= 1920);

    // 3. download what was stored, the way the admin page does, and inspect it
    const get = async (key: string, name: string) => {
      const signed = await adminImageUrl(key);
      const res = await fetch(signed, { cache: "no-store" });
      const buf = Buffer.from(await res.arrayBuffer());
      if (res.ok) writeFileSync(join(out, name), buf);
      return { res, buf, signed: new URL(signed) };
    };
    const main1 = await get(p.key, "stored-1920.webp");
    const thumb1 = await get(p.thumbKey!, "stored-400.webp");
    check("pending files: readable with a presigned address", main1.res.ok && thumb1.res.ok, `${main1.res.status}/${thumb1.res.status}`);
    // the storage API addresses the bucket as a subdomain of the account's endpoint
    check("the address is the storage API's, not the public domain", main1.signed.host.endsWith(new URL(r2Config().endpoint).host) && !main1.signed.href.startsWith(r2Config().publicUrl), main1.signed.host.split(".").slice(1).join("."));
    check("the address expires quickly", main1.signed.searchParams.get("X-Amz-Expires") === String(ADMIN_IMAGE_TTL_SECONDS));
    const unsigned = await status(`${main1.signed.origin}${main1.signed.pathname}`);
    check("without its signature the address is refused", unsigned >= 400 && unsigned < 500, `HTTP ${unsigned}`);
    if (!main1.res.ok || !thumb1.res.ok) return;
    for (const [n, b] of [["1920", main1.buf], ["400", thumb1.buf]] as const) {
      const m = await sharp(b).metadata();
      check(`${n}px webp: format webp, no EXIF/ICC/XMP/IPTC`, m.format === "webp" && !m.exif && !m.icc && !m.xmp && !m.iptc, `${m.width}x${m.height}`);
    }
    check("thumbnail is 400px on the long side", Math.max((await sharp(thumb1.buf).metadata()).width ?? 0, (await sharp(thumb1.buf).metadata()).height ?? 0) === 400);

    // 4. approval moves the files to a NEW public key; the pending objects are gone
    const approvedRow = await moveToVisibility({ id: p.id, eventId: event.id, key: p.key, thumbKey: p.thumbKey }, "public");
    created.push({ key: approvedRow.key, thumbKey: approvedRow.thumbKey });
    check("approve: new key is under photos/", approvedRow.key.startsWith(`photos/${event.id}/`) && approvedRow.key !== p.key);
    check("approve: new public URL serves the image", (await status(approvedRow.url)) === 200);
    check("approve: old pending files are gone", (await headR2(p.key)) === null && (await headR2(p.thumbKey!)) === null);

    const publicUrl = approvedRow.url;
    const backRow = await moveToVisibility({ id: p.id, eventId: event.id, key: approvedRow.key, thumbKey: approvedRow.thumbKey }, "pending");
    created.push({ key: backRow.key, thumbKey: backRow.thumbKey });
    check("unapprove: public files are gone", (await headR2(approvedRow.key)) === null);
    const dead = await status(publicUrl);
    check("unapprove: previously-public URL is dead", dead === 404 || dead === 403, `HTTP ${dead}`);
    check("unapprove: files now under photos-pending/", backRow.key.startsWith("photos-pending/"));

    // 5. delete removes the objects
    await deletePhotoObjects(backRow);
    check("delete: main + thumbnail gone from R2", (await headR2(backRow.key)) === null && (await headR2(backRow.thumbKey!)) === null);
  } finally {
    await deleteManyFromR2([tmpKey, ...created.flatMap((c) => [c.key, c.thumbKey ?? ""])]);
    await prisma.event.delete({ where: { id: event.id } }); // cascades the photo row
    await prisma.$disconnect();
  }
  console.log(failed === 0 ? "\nALL PASS" : `\n${failed} FAILED`);
  process.exit(failed === 0 ? 0 : 1);
}
main().catch((e) => { console.error(e); process.exit(1); });
