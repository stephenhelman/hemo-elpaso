# HOEP brand guide (for the website, email, print and social)

Source of truth: the brand sheet, [`public/brand/hoep-brand-sheet.pdf`](../public/brand/hoep-brand-sheet.pdf) (November 2026), and the artwork in `public/brand/`. The logo was originally drawn by the founder in 1993; this is the 2026 digital recreation. **Never recolor, stretch, rotate, or add effects to any logo file. Use the variants below instead.**

## Which file to use where

| Where | File | Notes |
| --- | --- | --- |
| Website header (light background) | `hoep-icon-color.svg` + live wordmark text | icon 40px tall in the header (see "Minimum sizes" for why) |
| Website footer / admin sidebar / any dark band | `hoep-icon-reversed-white.svg` + live wordmark text | white icon, pink "of El Paso" |
| Error / not-found / access-denied pages | `hoep-icon-color.svg` at 72px tall | no text beside it |
| Browser tab (favicon) | `src/app/icon.svg` (light + dark in one file), `src/app/favicon.ico` (16/32/48) | built from `hoep-favicon.svg` and `hoep-favicon-dark.svg` |
| Phone home-screen icon | `src/app/apple-icon.png` (180), `public/icons/icon-192.png`, `icon-512.png` | favicon drop on white, ~15% padding |
| Sanity Studio | `hoep-favicon.svg` | project icon and navbar logo |
| Social share image | `brand/og-default.png` (1200 × 630), also `src/app/opengraph-image.png` | lockup + tagline on white, nothing else; upload the same file to Site settings → SEO |
| Email header | `public/brand/email-header.png` (1200 px wide, shown at 600) | lockup + tagline on **solid white** so dark-mode clients cannot blend it into the background |
| Letters / board correspondence | `brand/HOEP-letterhead.docx` (PDF preview: `brand/HOEP-letterhead.pdf`) | large centered lockup + tagline (6 in wide) at the top of the page with a thin maroon rule under it, footer centered in 11 pt with phone, website, Facebook group; body Georgia 12 pt. Top margin is about 3 in to leave room for the header |
| Printed sign-in sheet | `hoep-lockup-horizontal-tagline.svg` | 3.1 in wide on paper |
| Structured data / search "logo" | `public/brand/hoep-icon-512.png` and `hoep-icon-color.svg` | |
| Print, one-color jobs (stamps, embroidery, pens) | `hoep-icon-1c-maroon.svg`, or `hoep-icon-small.svg` under 1 in tall | |
| Stacked layouts (square spaces) | `hoep-lockup-stacked.svg` / `-stacked-tagline.svg` | |

Regenerate every raster asset from the SVGs with `npx tsx scripts/build-brand-assets.ts`. Rebuild the letterhead with `NEXT_PUBLIC_SITE_URL=https://<public site> npx tsx scripts/make-letterhead.ts` (it refuses to run with a localhost URL).

## Colors

| Name | Hex | RGB | CMYK* | Use |
| --- | --- | --- | --- | --- |
| Maroon (brand primary) | `#8B1538` | 139, 21, 56 | 0, 85, 60, 45 | headings, buttons and rules in email, print and the sign-in sheet; Tailwind `brand-maroon` |
| Drop pink | `#FACED2` | 250, 206, 210 | 0, 18, 16, 2 | the drop, soft rules and tints; Tailwind `brand-pink` |
| Parent-hand coral | `#F57C86` | 245, 124, 134 | 0, 49, 45, 4 | the raised hand; Tailwind `brand-coral` |
| Outline ink | `#2A2426` | 42, 36, 38 | 0, 14, 10, 84 | body text on white in email/print, the outline of the art; Tailwind `brand-ink` |
| White | `#FFFFFF` | 255, 255, 255 | 0, 0, 0, 0 | |

\*CMYK values are straight conversions: have the printer proof maroon and coral; outline ink may be printed as a rich black.

**Note:** the website's Tailwind `primary` is still the older red `#C41E3A` (buttons, links), not the logo maroon. Emails, the sign-in sheet, the letterhead and the brand tokens use the maroon. Moving the whole site to maroon is a separate design decision.

## Typeface

**TeX Gyre Bonum Bold** (tagline: TeX Gyre Bonum Italic) is the brand face: Version 2.004, GUST e-foundry (Jackowski and Nowacki), a free Bookman revival. License: **GUST Font License**, free for commercial use (text in `src/fonts/GUST-FONT-LICENSE.txt`, notes in `src/fonts/README.md`).

- It is used **only for the wordmark** next to the icon in the website header and footer ("Hemophilia Outreach / of El Paso", self-hosted through `next/font/local`). Body text stays Inter and headings Poppins.
- The logo files have outlined lettering: no font is needed to use them.
- The org name is a proper noun and is the same in English and Spanish; the wordmark text is not translated.

## Minimum sizes

| | Print | Screen |
| --- | --- | --- |
| Full-detail icon | 1 in tall | **64 px tall** (below this: `hoep-icon-small` for print, `hoep-favicon` on screen) |
| `hoep-icon-small` | 0.25 in tall | n/a |
| `hoep-favicon` | n/a | 16 px |
| Horizontal lockup | 3 in wide | **400 px wide** (measured on the artwork, not the clear space) |
| Stacked lockup | 1.75 in wide | **240 px wide** |

Known exception: the website header and footer show the full-detail icon at **40 px and 48 px** tall (below the 64 px rule) because the header is 64 px high. If you want to follow the rule strictly, switch the header/footer to `hoep-favicon.svg` (a one-line change in `src/components/brand/BrandMark.tsx`) or make the header taller.

## Clear space

Keep X = one quarter of the drop's height clear on all four sides of every logo. The lockup files **already include it**, so place them edge to edge with other elements and do not add your own padding to the artwork (a plain white or neutral background is fine).

## Don't

- Don't recolor, stretch or squash, rotate, outline, shadow, glow or otherwise add effects to a logo.
- Don't place the full-color logo on a dark or busy background: use the reversed (white) icon on dark bands, the dark favicon on dark tabs.
- Don't redraw the lettering or retype the lockup in another font. Use the lockup files.
- Don't go below the minimum sizes above.
- Don't use a transparent-background PNG in email (use `email-header.png`, which is on solid white).
- Don't publish a mailing address on letterhead or anywhere else: HOEP does not publish one.
