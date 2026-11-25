/**
 * Builds src/lib/address/zip-data.json (the bundled US ZIP -> city/state table) from the `zipcodes` npm package's
 * lib/codes.js (BSD licence; US ZIP codes are public data). Dev-time only, nothing here runs in production:
 *   npm pack zipcodes && tar xzf zipcodes-*.tgz   (in an EMPTY scratch directory)
 *   npx tsx scripts/build-zip-data.ts <path to package/lib/codes.js>
 * The downloaded file is treated as DATA: it is read as text and parsed as JSON, never executed.
 * Format: { c: [city names], s: [state codes], z: { "79901": cityIndex * 100 + stateIndex } }
 */
import fs from "fs";
import path from "path";
import { US_STATES } from "../src/lib/address/states";

const src = process.argv[2];
if (!src) throw new Error("usage: build-zip-data.ts <codes.js>");
// The file has two lines: `exports.codes = {...};` and `exports.stateMap = {...};`. Only the first is used.
const text = fs.readFileSync(src, "utf8").split("\n")[0].trim();
const prefix = "exports.codes = ";
if (!text.startsWith(prefix)) throw new Error("unexpected codes.js format");
const codes = JSON.parse(text.slice(prefix.length).replace(/;\s*$/, "")) as Record<string, { zip: string; city: string; state: string; country: string }>;

const states = US_STATES.map((s) => s.code);
const cities: string[] = [];
const cityIdx = new Map<string, number>();
const z: Record<string, number> = {};
for (const r of Object.values(codes)) {
  if (r.country !== "US" || !/^\d{5}$/.test(r.zip)) continue;
  const si = states.indexOf(r.state);
  if (si < 0) continue;
  const city = r.city.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
  let ci = cityIdx.get(city);
  if (ci === undefined) { ci = cities.length; cities.push(city); cityIdx.set(city, ci); }
  z[r.zip] = ci * 100 + si;
}
const out = path.join(__dirname, "../src/lib/address/zip-data.json");
fs.writeFileSync(out, JSON.stringify({ c: cities, s: states, z }));
console.log(`wrote ${Object.keys(z).length} ZIPs, ${cities.length} cities -> ${out}`);
