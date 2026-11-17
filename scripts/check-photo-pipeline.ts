/**
 * End-to-end check of the gallery upload pipeline against the REAL R2 bucket and the dev database.
 *
 *   npm run check:photo-pipeline -- <outDir>
 *
 * Builds a ~12 MB phone-style JPEG (EXIF orientation 6 + GPS), then: presigned PUT into uploads/tmp/ (plain fetch, the
 * same request a browser makes) -> ingest -> checks -> approve/unapprove moves -> deletes everything it created.
 * Writes input.jpg and the stored files into <outDir> so `exiftool` can be run on them.
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

const prisma = new PrismaClient();
let failed = 0;
const check = (name: string, ok: boolean, extra = "") => {
  if (!ok) failed++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${extra ? `  (${extra})` : ""}`);
};
const status = async (url: string) => (await fetch(url, { method: "HEAD", cache: "no-store" })).status;

async function main() {
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

    // 3. download what was stored and inspect it
    const get = async (u: string, name: string) => {
      const res = await fetch(u, { cache: "no-store" });
      const buf = Buffer.from(await res.arrayBuffer());
      writeFileSync(join(out, name), buf);
      return { res, buf };
    };
    const main1 = await get(p.url, "stored-1920.webp");
    const thumb1 = await get(p.thumbUrl!, "stored-400.webp");
    check("stored files are fetchable at their (unguessable) URLs", main1.res.ok && thumb1.res.ok, `${main1.res.status}/${thumb1.res.status}`);
    for (const [n, b] of [["1920", main1.buf], ["400", thumb1.buf]] as const) {
      const m = await sharp(b).metadata();
      check(`${n}px webp: format webp, no EXIF/ICC/XMP/IPTC`, m.format === "webp" && !m.exif && !m.icc && !m.xmp && !m.iptc, `${m.width}x${m.height}`);
    }
    check("thumbnail is 400px on the long side", Math.max((await sharp(thumb1.buf).metadata()).width ?? 0, (await sharp(thumb1.buf).metadata()).height ?? 0) === 400);

    // 4. approval moves the files to a NEW public key; the pending URL dies
    const pendingUrl = p.url;
    const approvedRow = await moveToVisibility({ id: p.id, eventId: event.id, key: p.key, thumbKey: p.thumbKey }, "public");
    created.push({ key: approvedRow.key, thumbKey: approvedRow.thumbKey });
    check("approve: new key is under photos/", approvedRow.key.startsWith(`photos/${event.id}/`) && approvedRow.key !== p.key);
    check("approve: new public URL serves the image", (await status(approvedRow.url)) === 200);
    check("approve: old pending URL no longer serves it", (await status(pendingUrl)) === 404);

    const publicUrl = approvedRow.url;
    const backRow = await moveToVisibility({ id: p.id, eventId: event.id, key: approvedRow.key, thumbKey: approvedRow.thumbKey }, "pending");
    created.push({ key: backRow.key, thumbKey: backRow.thumbKey });
    check("unapprove: previously-public URL is dead", (await status(publicUrl)) === 404);
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
