/** Minimal portable-text helpers (used by the dictionary fallback and the seed script). */
export const ptBlock = (text: string, key = "b0") => ({
  _type: "block",
  _key: key,
  style: "normal",
  markDefs: [],
  children: [{ _type: "span", _key: `${key}s`, text, marks: [] }],
});
export const ptSimple = (text: string) => [ptBlock(text)];
export const localizedPt = (en: string, es: string) => ({ en: ptSimple(en), es: ptSimple(es) });
