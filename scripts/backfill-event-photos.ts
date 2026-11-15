/**
 * Backfill for EventPhoto rows uploaded before the gallery work.
 *
 *   npm run photos:backfill              # dry run: lists what it would do
 *   npm run photos:backfill -- --apply   # does it
 *
 * For each row without a thumbnail it downloads the stored image, runs it through the SAME pipeline as new uploads
 * (strip ALL metadata, re-encode to 1920px webp, make a 400px webp thumbnail, record width/height), writes the files under
 * a fresh random key and repoints the row. Unapproved rows go to photos-pending/, approved rows to photos/, so old
 * guessable keys (photos/<event>/<timestamp>-<filename>.webp) stop being valid. Old objects are deleted afterwards.
 *
 * Idempotent: rows that already have a thumbnail are skipped. Note: the old uploader never applied the EXIF rotation
 * (it only discarded it), and the originals are gone, so a photo that was sideways stays sideways.
 * Refuses to run against the production database unless ALLOW_PROD_DB=yes (db-guard).
 */
import "./_load-env";
import { PrismaClient } from "@prisma/client";
import { deleteManyFromR2, getR2Buffer, r2PublicUrl, uploadToR2 } from "../src/lib/r2";
import { newPhotoKeys } from "../src/lib/photos/keys";
import { processImage } from "../src/lib/photos/process";

const prisma = new PrismaClient();
const apply = process.argv.includes("--apply");

async function main() {
  const rows = await prisma.eventPhoto.findMany({ where: { thumbKey: null }, orderBy: [{ eventId: "asc" }, { uploadedAt: "asc" }] });
  console.log(`${rows.length} photo(s) need a thumbnail${apply ? "" : " (dry run; pass --apply to change anything)"}`);
  let ok = 0, failed = 0;
  for (const p of rows) {
    const target = p.approved ? "public" : "pending";
    console.log(`- ${p.id}  event ${p.eventId}  ${p.approved ? "approved" : "unapproved"}  ${p.key}  -> ${target}`);
    if (!apply) continue;
    try {
      const out = await processImage(await getR2Buffer(p.key));
      const keys = newPhotoKeys(p.eventId, target);
      await uploadToR2(out.main, keys.key, "image/webp");
      await uploadToR2(out.thumb, keys.thumbKey, "image/webp");
      await prisma.eventPhoto.update({
        where: { id: p.id },
        data: { key: keys.key, url: r2PublicUrl(keys.key), thumbKey: keys.thumbKey, thumbUrl: r2PublicUrl(keys.thumbKey), width: out.width, height: out.height },
      });
      await deleteManyFromR2([p.key]); // only after the row points at the new files
      ok++;
    } catch (err) {
      failed++;
      console.error(`  FAILED: ${(err as Error).message}`);
    }
  }
  if (apply) console.log(`done: ${ok} updated, ${failed} failed`);
  await prisma.$disconnect();
  process.exit(failed ? 1 : 0);
}
main().catch((e) => { console.error(e); process.exit(1); });
