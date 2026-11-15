/**
 * Generates every raster/derived brand asset from the SVGs in public/brand/ (the source of truth).
 *   npx tsx scripts/build-brand-assets.ts
 * Outputs (all committed): src/app/icon.svg, favicon.ico, apple-icon.png, opengraph-image.png,
 * public/icons/icon-{192,512}.png, public/brand/{hoep-icon-512,email-header}.png,
 * brand/{og-default,letterhead-logo}.png.
 * Rules from the brand sheet: never recolor/stretch/rotate/add effects; lockup files already contain their clear
 * space, so they are placed edge to edge with a white background only.
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const brand = (f: string) => path.join(root, "public/brand", f);
const read = (f: string) => fs.readFileSync(brand(f), "utf8");
const WHITE = { r: 255, g: 255, b: 255, alpha: 1 };

const png = (svg: string, width: number, height?: number) => {
  // rasterise at ~2x the target (cap keeps librsvg under sharp's pixel limit), then resize down
  const vbW = Number(/viewBox="[-\d.]+ [-\d.]+ ([\d.]+)/.exec(svg)?.[1] ?? 400);
  const density = Math.min(600, Math.max(72, Math.round((72 * 2 * width) / vbW)));
  return sharp(Buffer.from(svg), { density })
    .resize(width, height, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
};

/** The favicon drop centred on white with `pad` (fraction) of padding on every side. */
async function dropOnWhite(size: number, pad: number, svgFile = "hoep-favicon.svg") {
  const inner = Math.round(size * (1 - 2 * pad));
  const mark = await png(read(svgFile), inner, inner);
  return sharp({ create: { width: size, height: size, channels: 4, background: WHITE } })
    .composite([{ input: mark, gravity: "center" }])
    .png()
    .toBuffer();
}

/** Lockup on solid white (no transparency: survives dark-mode email clients and social crops). */
async function lockupOnWhite(file: string, width: number, canvasW?: number, canvasH?: number) {
  const mark = await png(read(file), width);
  const meta = await sharp(mark).metadata();
  const w = canvasW ?? meta.width!, h = canvasH ?? meta.height!;
  return sharp({ create: { width: w, height: h, channels: 4, background: WHITE } })
    .composite([{ input: mark, gravity: "center" }])
    .flatten({ background: WHITE })
    .png()
    .toBuffer();
}

/** PNG-in-ICO container (Vista+): header + one directory entry per image. */
function ico(images: { size: number; data: Buffer }[]) {
  const head = Buffer.alloc(6);
  head.writeUInt16LE(0, 0); head.writeUInt16LE(1, 2); head.writeUInt16LE(images.length, 4);
  let offset = 6 + 16 * images.length;
  const dirs: Buffer[] = [];
  for (const im of images) {
    const d = Buffer.alloc(16);
    d.writeUInt8(im.size >= 256 ? 0 : im.size, 0); d.writeUInt8(im.size >= 256 ? 0 : im.size, 1);
    d.writeUInt8(0, 2); d.writeUInt8(0, 3); d.writeUInt16LE(1, 4); d.writeUInt16LE(32, 6);
    d.writeUInt32LE(im.data.length, 8); d.writeUInt32LE(offset, 12);
    offset += im.data.length; dirs.push(d);
  }
  return Buffer.concat([head, ...dirs, ...images.map((i) => i.data)]);
}

async function main() {
  // ---- favicon: ONE svg that follows the browser's colour scheme (light = hoep-favicon, dark = hoep-favicon-dark)
  const inner = (s: string) => s.replace(/^[\s\S]*?<\/title>/, "").replace(/<\/svg>\s*$/, "");
  const light = read("hoep-favicon.svg"), dark = read("hoep-favicon-dark.svg");
  const iconSvg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-53.223 0 478.109 478.109" role="img" aria-labelledby="hoep-fav-title">` +
    `<title id="hoep-fav-title">Hemophilia Outreach of El Paso</title>` +
    `<style>.hoep-d{display:none}@media (prefers-color-scheme:dark){.hoep-l{display:none}.hoep-d{display:inline}}</style>` +
    `<g class="hoep-l">${inner(light)}</g><g class="hoep-d">${inner(dark)}</g></svg>\n`;
  fs.writeFileSync(path.join(root, "src/app/icon.svg"), iconSvg);

  // favicon.ico 16/32/48 (the light favicon on a transparent background)
  const icoImgs = await Promise.all([16, 32, 48].map(async (size) => ({ size, data: await png(light, size, size) })));
  fs.writeFileSync(path.join(root, "src/app/favicon.ico"), ico(icoImgs));

  // apple-icon (180) and manifest icons: favicon drop on white, ~15% padding
  fs.writeFileSync(path.join(root, "src/app/apple-icon.png"), await dropOnWhite(180, 0.15));
  fs.writeFileSync(path.join(root, "public/icons/icon-192.png"), await dropOnWhite(192, 0.15));
  fs.writeFileSync(path.join(root, "public/icons/icon-512.png"), await dropOnWhite(512, 0.15));

  // 512px full-colour icon on white (structured-data logo)
  const icon = await png(read("hoep-icon-color.svg"), 380, 400);
  fs.writeFileSync(
    path.join(root, "public/brand/hoep-icon-512.png"),
    await sharp({ create: { width: 512, height: 512, channels: 4, background: WHITE } }).composite([{ input: icon, gravity: "center" }]).png().toBuffer(),
  );

  // email header: lockup + tagline, 1200px wide (shown at 600), solid white
  fs.writeFileSync(path.join(root, "public/brand/email-header.png"), await lockupOnWhite("hoep-lockup-horizontal-tagline.svg", 1200));

  // social share image 1200x630: the lockup (clear space is built in) centred on white, nothing else
  const og = await lockupOnWhite("hoep-lockup-horizontal-tagline.svg", 940, 1200, 630);
  fs.mkdirSync(path.join(root, "brand"), { recursive: true });
  fs.writeFileSync(path.join(root, "brand/og-default.png"), og);
  fs.writeFileSync(path.join(root, "src/app/opengraph-image.png"), og);

  // letterhead logo (3.5in at 400dpi)
  fs.writeFileSync(path.join(root, "brand/letterhead-logo.png"), await lockupOnWhite("hoep-lockup-horizontal-tagline.svg", 1400));

  console.log("brand assets written");
}
main().catch((e) => { console.error(e); process.exit(1); });
