# File storage (Cloudflare R2)

Event photos and flyers live in R2. There is **one bucket for production** and **a separate one for everything else**.

| Where the site runs | Bucket | Enforced by |
| --- | --- | --- |
| Vercel Production | the production bucket | |
| Local development, Vercel Preview, scripts | `hoep-media-dev` | `src/lib/r2-config.ts` refuses the production bucket outside production |
| Check scripts (`npm run check:*`) | `hoep-media-dev`, or their storage parts are skipped | never production, even with the opt-in below |

The production bucket is recognised by SHA-256 hashes of its name and of the host the live site serves files from
(`src/lib/r2-production.ts`). Update both if production storage moves.

**One deliberate command against production** (for example `scripts/legacy-data-counts.ts`): type
`R2_ALLOW_PROD_BUCKET=yes` in front of that command, with the production values in your shell. Don't put it in a file
or in Vercel.

A missing or refused setting does not stop the website: photo and flyer actions answer "storage is not available", and
the server log names the setting. A production build with a missing setting still fails, so the previous deployment
stays live.

## Create the development bucket

Menu labels are from Cloudflare's documentation as read on 2026-11-28.

### 1. Bucket

Cloudflare dashboard → **R2** → **Create bucket** → name `hoep-media-dev`. Leave the other options at their defaults.

### 2. Public address for approved files

Open the bucket → **Settings** → **Public Development URL** → **Enable** → type `allow` → **Allow**. Copy the
`https://pub-….r2.dev` address.

> Everything in this bucket can be fetched by anyone who has a file's address, **including photos that are not
> approved**: the rule that blocks the pending area exists only on the production domain, and `r2.dev` can't have one.
> Use test images only, never photos of real families. Cloudflare rate-limits `r2.dev` and means it for development.

### 3. A key for this bucket only

R2 **Overview** → **Account Details** → **Manage** next to **API Tokens** → **Create Account API token** (or **User API
token**):

- Name: `hoep-media-dev (local and preview)`
- Permissions: **Object Read & Write**
- Limit it to specific buckets and choose **only `hoep-media-dev`**. Check the summary before creating: a token that
  applies to all buckets can reach production.

Copy the **Access Key ID** and **Secret Access Key** now; the secret is shown once. The account ID is the same one
production uses.

### 4. CORS (the browser uploads straight to R2)

Bucket → **Settings** → **CORS Policy** → add:

```json
[
  {
    "AllowedOrigins": ["http://localhost:3000"],
    "AllowedMethods": ["GET", "PUT", "HEAD"],
    "AllowedHeaders": ["content-type", "content-length"],
    "MaxAgeSeconds": 3600
  }
]
```

To upload from a Vercel preview, add that preview's exact address (`https://….vercel.app`, no path or trailing slash) to
`AllowedOrigins`. A change can take half a minute to apply.

### 5. Point development at it

In `.env.local`, replace all five values (delete the production ones):

```bash
R2_ACCOUNT_ID=...                          # unchanged
R2_ACCESS_KEY_ID=...                       # the new token
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=hoep-media-dev
R2_PUBLIC_URL=https://pub-....r2.dev
```

Vercel → Settings → Environment Variables → **Preview**: set the same five. Production stays as it is.

Then, in Cloudflare, **delete the API token that was in `.env.local`** if production does not use it. If Production in
Vercel uses that same token, create a new one for production, put it in Vercel, redeploy, check an upload, and only then
delete the old one.

### 6. Clean up automatically (recommended)

Bucket → **Settings** → **Object lifecycle rules**: delete objects under the prefix `uploads/tmp/` after 1 day.

### 7. Verify

```bash
npm run check:r2-config
npm run check:flyer-upload
npm run check:photo-pipeline -- /tmp/photo-check
```

Neither should say SKIP. Then run the site, upload a photo to a test event, check it shows as Pending, approve it, and
find it in the public gallery.

## How a photo that isn't approved is read

The admin page asks `/api/admin/events/<event>/photos/<photo>/image`. After the permission check the site redirects to a
**presigned address on the storage API**, valid for 2 minutes. Admin pages and APIs never receive a public address for a
pending photo. In production the public domain also blocks `/photos-pending/` and `/uploads/`
(`overhaul/CUTOVER.md`, step 6).

## Production CORS

Uploads need `PUT` from every origin that opens `/admin` (`overhaul/CUTOVER.md`, step 3). Showing pending photos needs
no CORS rule.
