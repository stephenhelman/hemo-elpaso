/** Anchor ids for list sections (/resources#camps, #conferences). PURE. Every id on a page is unique. */
import type { Section } from "../types";

const CATEGORY_ANCHOR: Record<string, string> = {
  condition: "conditions",
  nationalOrg: "national",
  localCare: "local",
  youthProgram: "camps",
  financialHelp: "financial",
};

export const categoryAnchor = (category: string) =>
  CATEGORY_ANCHOR[category] ?? `resources-${category.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

/**
 * Section `_key` -> id. The first list of a category keeps the plain name; a second one gets "-2", and so on.
 * Sections with nothing to show render nothing, so they do not claim a name.
 */
export function sectionAnchors(sections: Section[]): Record<string, string> {
  const out: Record<string, string> = {};
  const used = new Set<string>();
  for (const s of sections) {
    if (s._type !== "resourceList" && s._type !== "conferenceList") continue;
    if (!s.items?.length) continue;
    const base = s._type === "conferenceList" ? "conferences" : categoryAnchor(s.category);
    let id = base;
    for (let n = 2; used.has(id); n++) id = `${base}-${n}`;
    used.add(id);
    out[s._key] = id;
  }
  return out;
}
