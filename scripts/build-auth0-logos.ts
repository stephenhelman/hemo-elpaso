/**
 * Auth0 login-page logos from the brand artwork (no layout changes to the site).
 *   npx tsx scripts/build-auth0-logos.ts
 * Writes public/brand/auth0-mark.png (the icon, trimmed, ~4% padding, 400px tall, transparent) and
 * public/brand/auth0-lockup.png (icon + "HOEP" in the brand face, trimmed, 160px tall, transparent).
 * The icon artwork is untouched (hoep-icon-color.svg); the wordmark uses TeX Gyre Bonum Bold (src/fonts) in the lockup's ink colour.
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const out = (f: string) => path.join(root, "public/brand", f);
const icon = fs.readFileSync(out("hoep-icon-color.svg"));
const INK = "#2A2426";

async function trimmedIcon(height: number) {
  const big = await sharp(icon, { density: 400 }).png().toBuffer();
  const trimmed = await sharp(big).trim({ threshold: 1 }).png().toBuffer();
  return sharp(trimmed).resize({ height }).png().toBuffer();
}

/**
 * "HOEP" built from the letters H, O, E, P of the outlined "HEMOPHILIA OUTREACH" in hoep-lockup-horizontal.svg (the brand face,
 * no font needed). Letters are cut out of a high-resolution render and re-spaced with the artwork's own letter gap.
 */
async function hoepWord(): Promise<Buffer> {
  const svg = fs.readFileSync(out("hoep-lockup-horizontal.svg"));
  const { data, info } = await sharp(svg, { density: 300 }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width, Hh = info.height;
  const dark = (x: number, y: number) => { const i = (y * W + x) * 4; return data[i + 3] > 128 && data[i] < 90 && data[i + 1] < 90; };
  // the title band: rows with dark pixels right of the icon (x > 2100 of 6830 at 300 dpi), above the pink bar
  const x0 = Math.round(W * 0.31);
  const rows: number[] = [];
  for (let y = 0; y < Hh; y++) { let c = 0; for (let x = x0; x < W; x += 3) if (dark(x, y)) c++; rows.push(c); }
  const first = rows.findIndex((c) => c > 0);
  let last = first; while (rows[last + 1] > 0) last++;
  const cols: number[] = [];
  for (let x = x0; x < W; x++) { let c = 0; for (let y = first; y <= last; y++) if (dark(x, y)) c++; cols.push(c); }
  const segs: [number, number][] = []; let st = -1;
  for (let i = 0; i < cols.length; i++) { if (cols[i] > 0 && st < 0) st = i; if (cols[i] === 0 && st >= 0) { segs.push([st + x0, i - 1 + x0]); st = -1; } }
  // HEMOPHILIA: H E M O P ...
  const pick = [0, 3, 1, 4]; // H O E P
  const letters = await Promise.all(pick.map((k) => sharp(svg, { density: 300 }).extract({ left: segs[k][0], top: first, width: segs[k][1] - segs[k][0] + 1, height: last - first + 1 }).png().toBuffer()));
  const gap = segs[1][0] - segs[0][1]; // the artwork's gap between H and E
  const widths = pick.map((k) => segs[k][1] - segs[k][0] + 1);
  const total = widths.reduce((a, b) => a + b, 0) + gap * 3;
  let left = 0;
  const parts = letters.map((input, i) => { const l = left; left += widths[i] + gap; return { input, left: l, top: 0 }; });
  const word = await sharp({ create: { width: total, height: last - first + 1, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } }).composite(parts).png().toBuffer();
  return sharp(word).resize({ height: 72 }).png().toBuffer();
}

async function main() {
  // 1. mark: content 400/1.08 tall + 4% padding top and bottom (and the same in pixels at the sides)
  const content = Math.round(400 / 1.08);
  const pad = Math.round((400 - content) / 2);
  const m = await trimmedIcon(content);
  await sharp(m).extend({ top: pad, bottom: 400 - content - pad, left: pad, right: pad, background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toFile(out("auth0-mark.png"));

  // 2. lockup, 160px tall: icon full height + HOEP, vertically centred
  const H = 160;
  const mark = await trimmedIcon(H);
  const mw = (await sharp(mark).metadata()).width!;
  const t = await hoepWord();
  const tm = await sharp(t).metadata();
  const gap = 18;
  const W = mw + gap + tm.width!;
  const top = Math.round((H - tm.height!) / 2);
  await sharp({ create: { width: W, height: H, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: mark, left: 0, top: 0 }, { input: t, left: mw + gap, top }])
    .png().toFile(out("auth0-lockup.png"));
  console.log("lockup", W, "x", H, "aspect", (W / H).toFixed(2), "text height", tm.height);
}
main();
