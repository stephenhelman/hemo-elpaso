/**
 * Builds brand/HOEP-letterhead.docx for board correspondence.
 *   NEXT_PUBLIC_BASE_URL=https://<public site> npx tsx scripts/make-letterhead.ts
 * Letter size, 1" margins. Header: horizontal lockup + tagline (about 3.5in wide) and a thin maroon rule.
 * Footer: phone, website domain, Facebook group, small and ink-coloured. No mailing address (none is published).
 * Body: a readable serif (Georgia). Brand colours: maroon #8B1538, outline ink #2A2426.
 */
import fs from "node:fs";
import {
  AlignmentType, BorderStyle, Document, Footer, Header, ImageRun, Packer, Paragraph, TabStopType, TextRun,
} from "docx";
import { FACEBOOK_URL, SITE_PHONE } from "../src/lib/site";

try { process.loadEnvFile(".env.local"); } catch {}
const MAROON = "8B1538";
const INK = "2A2426";
const SERIF = "Georgia";

const base = process.env.LETTERHEAD_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || "";
const host = (() => { try { return new URL(base).host; } catch { return ""; } })();
if (!host || /localhost|127\.0\.0\.1/.test(host)) {
  throw new Error(`Set NEXT_PUBLIC_BASE_URL (or LETTERHEAD_SITE_URL) to the PUBLIC site URL; got "${base}"`);
}

const logo = fs.readFileSync("brand/letterhead-logo.png"); // 1400 x 613
const LOGO_W_IN = 3.5;
const px = (inches: number) => Math.round(inches * 96);
const logoW = px(LOGO_W_IN), logoH = Math.round((logoW * 613) / 1400);

const small = (text: string) => new TextRun({ text, font: SERIF, size: 17, color: INK }); // 8.5pt

const body = (text: string) =>
  new Paragraph({ spacing: { after: 200, line: 300 }, children: [new TextRun({ text, font: SERIF, size: 22, color: INK })] });

const doc = new Document({
  creator: "Hemophilia Outreach of El Paso",
  title: "HOEP letterhead",
  styles: { default: { document: { run: { font: SERIF, size: 22, color: INK } } } },
  sections: [
    {
      properties: {
        page: {
          size: { width: 12240, height: 15840 }, // US Letter, twips
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440, header: 540, footer: 540 },
        },
      },
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              alignment: AlignmentType.LEFT,
              spacing: { after: 60 },
              children: [new ImageRun({ type: "png", data: logo, transformation: { width: logoW, height: logoH }, altText: { name: "HOEP logo", title: "Hemophilia Outreach of El Paso", description: "Hemophilia Outreach of El Paso, Giving Hope To Our Community" } })],
            }),
            // thin maroon rule (0.75pt)
            new Paragraph({ spacing: { after: 0 }, border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: MAROON, space: 1 } }, children: [] }),
          ],
        }),
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              border: { top: { style: BorderStyle.SINGLE, size: 4, color: MAROON, space: 6 } },
              tabStops: [{ type: TabStopType.CENTER, position: 4680 }],
              children: [small(`${SITE_PHONE.display}   ·   ${host}   ·   ${FACEBOOK_URL.replace(/^https?:\/\//, "")}`)],
            }),
          ],
        }),
      },
      children: [
        body("[Date]"),
        body("[Recipient name]"),
        body("[Title / organization]"),
        body("Dear [Name],"),
        body("Write your letter here. The body uses Georgia 11 pt in outline ink (#2A2426); the header and footer repeat on every page."),
        body("Sincerely,"),
        new Paragraph({ spacing: { before: 600 }, children: [new TextRun({ text: "[Name]", font: SERIF, size: 22, color: INK, bold: true })] }),
        new Paragraph({ children: [new TextRun({ text: "[Role], Hemophilia Outreach of El Paso", font: SERIF, size: 22, color: INK })] }),
      ],
    },
  ],
});

Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync("brand/HOEP-letterhead.docx", buf);
  console.log(`brand/HOEP-letterhead.docx written (footer: ${SITE_PHONE.display} · ${host} · Facebook group)`);
});
