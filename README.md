This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Email in local development

No email reaches Resend unless the app is running in production or you opt in (`EMAIL_MODE`, see `.env.example`):

- **Default (local dev, preview deploys, every `check:*` script): `capture`.** Nothing is sent. Each email is rendered, logged with status `captured`, and written to `.email-outbox/<timestamp>-<kind>.html` (gitignored). Open the file in a browser to see it. Tests read the in-memory outbox (`emailOutbox()` in `src/lib/email/send.ts`).
- **See a real email in your own inbox:** set `EMAIL_MODE=allowlist` and `EMAIL_DEV_ALLOWLIST=you@example.com` in `.env.local` (plus a `RESEND_API_KEY`). Only listed addresses are sent; everything else is still captured.
- **`live`** is only valid when `VERCEL_ENV=production`. Setting it anywhere else makes the app refuse to start, so a stray variable can't turn dev into live sending.
- All sending goes through `deliverEmail()` in `src/lib/email/send.ts`. Don't construct a Resend client anywhere else: `npm run check:email-guard` fails if you do.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
