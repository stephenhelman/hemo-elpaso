/**
 * The four bilingual text fields of an Event, shared by create (POST) and edit
 * (PATCH) so both persist them identically.
 *  - English is required; saving never depends on translating.
 *  - A blank Spanish value falls back to the English one.
 */
export function eventTextFields(body: Record<string, unknown>):
  | { ok: true; data: { titleEn: string; titleEs: string; descriptionEn: string | null; descriptionEs: string | null } }
  | { ok: false; error: string } {
  const s = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  const titleEn = s(body.titleEn);
  if (!titleEn) return { ok: false, error: "An English title is required" };
  const descriptionEn = s(body.descriptionEn);
  return {
    ok: true,
    data: {
      titleEn,
      titleEs: s(body.titleEs) || titleEn,
      descriptionEn: descriptionEn || null,
      descriptionEs: s(body.descriptionEs) || descriptionEn || null,
    },
  };
}
