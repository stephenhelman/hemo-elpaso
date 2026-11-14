/**
 * Regression check: event create AND edit persist all four bilingual text fields
 * (titleEn/titleEs/descriptionEn/descriptionEs), with and without Translate, and
 * with English only.
 *
 *   npm run check:event-save      (DB part refuses production, like other db scripts)
 *
 * The DB part writes one temporary event and deletes it by id in `finally`.
 */
import { config } from "dotenv";
config({ path: ".env.local" });
config();
import { PrismaClient } from "@prisma/client";
import { eventTextFields } from "../src/lib/events/text-fields";

let failed = 0;
const eq = (name: string, got: unknown, want: unknown) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) failed++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${ok ? "" : `  got ${JSON.stringify(got)} want ${JSON.stringify(want)}`}`);
};
const data = (b: Record<string, unknown>) => {
  const r = eventTextFields(b);
  return r.ok ? r.data : r;
};

async function main() {
  // Mapping (what both routes use)
  eq("both languages", data({ titleEn: "T", titleEs: "Tes", descriptionEn: "D", descriptionEs: "Des" }), { titleEn: "T", titleEs: "Tes", descriptionEn: "D", descriptionEs: "Des" });
  eq("English only -> Spanish falls back", data({ titleEn: "T", titleEs: "", descriptionEn: "D", descriptionEs: "" }), { titleEn: "T", titleEs: "T", descriptionEn: "D", descriptionEs: "D" });
  eq("no description", data({ titleEn: "T" }), { titleEn: "T", titleEs: "T", descriptionEn: null, descriptionEs: null });
  eq("missing English title is rejected", eventTextFields({ titleEn: "  ", titleEs: "x" }).ok, false);

  // Round trip through the same mapping + Prisma
  const url = process.env.DATABASE_URL ?? "";
  if (url.includes("ep-weathered-dream-aezg1oqp") && process.env.ALLOW_PROD_DB !== "yes") {
    console.log("SKIP  DB round trip (DATABASE_URL is production; set ALLOW_PROD_DB=yes to run it)");
  } else {
    const prisma = new PrismaClient();
    const slug = `zz-check-${Date.now()}`;
    let id: string | undefined;
    try {
      const base = { slug, eventDate: new Date(Date.now() + 864e5), location: "x", createdBy: "check" };
      const c = eventTextFields({ titleEn: "Create EN", titleEs: "", descriptionEn: "Desc EN", descriptionEs: "" });
      if (!c.ok) throw new Error("mapping");
      const created = await prisma.event.create({ data: { ...base, ...c.data } });
      id = created.id;
      eq("create persists all four", [created.titleEn, created.titleEs, created.descriptionEn, created.descriptionEs], ["Create EN", "Create EN", "Desc EN", "Desc EN"]);
      const u = eventTextFields({ titleEn: "Edit EN", titleEs: "Edit ES", descriptionEn: "Edit D EN", descriptionEs: "Edit D ES" });
      if (!u.ok) throw new Error("mapping");
      const updated = await prisma.event.update({ where: { id }, data: u.data });
      eq("edit persists all four", [updated.titleEn, updated.titleEs, updated.descriptionEn, updated.descriptionEs], ["Edit EN", "Edit ES", "Edit D EN", "Edit D ES"]);
    } finally {
      if (id) await prisma.event.delete({ where: { id } }).catch(() => undefined);
      await prisma.$disconnect();
    }
  }
  console.log(failed ? `\n${failed} FAILED` : "\nall passed");
  process.exit(failed ? 1 : 0);
}
main().catch((e) => { console.error(e); process.exit(1); });
