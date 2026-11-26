/**
 * One-off, for the R2 custom-domain switch (a new R2_PUBLIC_URL).
 * Stored photo and flyer URLs are FULL URLs written when each file was uploaded, so changing R2_PUBLIC_URL only
 * affects new files. This rewrites the prefix on existing rows. DRY RUN unless --apply. Prints counts only.
 *
 *   npx tsx scripts/rewrite-media-urls.ts --from <old R2_PUBLIC_URL> --to <new R2_PUBLIC_URL>
 *   npx tsx scripts/rewrite-media-urls.ts --from ... --to ... --apply
 *
 * Uses DATABASE_URL from the environment (.env.local = dev). For production put the production DATABASE_URL in your
 * shell for that one command. Touches only: event_photos.url/thumbUrl, events.flyerEnUrl/flyerEsUrl.
 */
import "./_load-env";
import { PrismaClient } from "@prisma/client";

const arg = (n: string) => { const i = process.argv.indexOf(n); return i > -1 ? process.argv[i + 1] : undefined; };
const from = arg("--from")?.replace(/\/+$/, "");
const to = arg("--to")?.replace(/\/+$/, "");
const apply = process.argv.includes("--apply");
if (!from || !to || from === to) { console.error("Usage: --from <old R2_PUBLIC_URL> --to <new R2_PUBLIC_URL> [--apply]"); process.exit(1); }

const prisma = new PrismaClient();
const re = (s: string | null) => (s && s.startsWith(from + "/") ? to + s.slice(from.length) : s);

async function main() {
  console.log(`${apply ? "APPLYING" : "DRY RUN"}: ${from}  ->  ${to}`);
  const photos = await prisma.eventPhoto.findMany({ select: { id: true, url: true, thumbUrl: true } });
  let p = 0;
  for (const r of photos) {
    const u = re(r.url), t = re(r.thumbUrl);
    if (u === r.url && t === r.thumbUrl) continue;
    p++;
    if (apply) await prisma.eventPhoto.update({ where: { id: r.id }, data: { url: u!, thumbUrl: t } });
  }
  const events = await prisma.event.findMany({ select: { id: true, flyerEnUrl: true, flyerEsUrl: true } });
  let e = 0;
  for (const r of events) {
    const en = re(r.flyerEnUrl), es = re(r.flyerEsUrl);
    if (en === r.flyerEnUrl && es === r.flyerEsUrl) continue;
    e++;
    if (apply) await prisma.event.update({ where: { id: r.id }, data: { flyerEnUrl: en, flyerEsUrl: es } });
  }
  console.log(`event_photos rows ${apply ? "updated" : "to update"}: ${p} of ${photos.length}`);
  console.log(`events (flyers) ${apply ? "updated" : "to update"}: ${e} of ${events.length}`);
}
main().catch((x) => { console.error(x); process.exit(1); }).finally(() => prisma.$disconnect());
