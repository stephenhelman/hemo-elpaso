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

/** Several paragraphs → several blocks. */
export const ptMulti = (paragraphs: string[]) => paragraphs.map((t, i) => ptBlock(t, `p${i}`));
export const localizedPtMulti = (en: string[], es: string[]) => ({ en: ptMulti(en), es: ptMulti(es) });
