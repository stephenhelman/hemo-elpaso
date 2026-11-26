/**
 * Saving flyers, browser side: presign -> PUT straight to R2 -> finalize (server side: lib/flyers/upload.ts).
 * Every failure throws FlyerUploadError with a message fit to show. Failures the server cannot see (the direct PUT, a
 * request refused before it reached the app) are also reported to it, so they appear in the server log.
 */
import { flyerFileError, LANG_LABEL, type Lang } from "./index";

export type ClientStep = "presign" | "upload" | "finalize";

export class FlyerUploadError extends Error {
  constructor(public step: ClientStep, message: string) {
    super(message);
    this.name = "FlyerUploadError";
  }
}

export interface FlyerSaveInput {
  files: { en?: File | null; es?: File | null };
  alt: { en: string; es: string };
}

export interface SavedFlyers { flyerEnUrl: string | null; flyerEsUrl: string | null; flyerEnAlt?: string | null; flyerEsAlt?: string | null }

interface Presigned { lang: Lang; key: string; url: string; headers: Record<string, string> }

export async function saveFlyers(eventId: string, input: FlyerSaveInput, doFetch: typeof fetch = (...a) => fetch(...a)): Promise<SavedFlyers> {
  const api = `/api/admin/events/${eventId}/flyers`;
  const json = (body: unknown): RequestInit => ({ method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

  const report = async (step: ClientStep, detail: { lang?: Lang; httpStatus?: number; message: string }) => {
    console.error(`[flyers] ${step} failed`, detail);
    await doFetch(`${api}/client-error`, json({ step, ...detail })).catch(() => {});
  };

  /** One call to our own API. A reply that is not ours (platform error page, sign-in page) is reported to the server. */
  const call = async <T>(step: "presign" | "finalize", url: string, body: unknown): Promise<T> => {
    const what = step === "presign" ? "start the upload" : "save the flyer";
    let res: Response;
    try {
      res = await doFetch(url, json(body));
    } catch (e) {
      const message = `Could not ${what}: the server could not be reached. Check your connection and try again.`;
      await report(step, { message: `network error: ${(e as Error).message}` });
      throw new FlyerUploadError(step, message);
    }
    const data = (await res.json().catch(() => null)) as (T & { success?: boolean; error?: string }) | null;
    if (res.ok && data?.success === true) return data;
    if (!data?.error) await report(step, { httpStatus: res.status, message: "unexpected response" });
    if (res.status === 401) throw new FlyerUploadError(step, "Your sign-in expired. Sign in again, then retry.");
    throw new FlyerUploadError(step, data?.error ? `Could not ${what}: ${data.error}` : `Could not ${what} (HTTP ${res.status}).`);
  };

  const picked = (["en", "es"] as const).flatMap((lang) => {
    const file = input.files[lang];
    return file ? [{ lang, file }] : [];
  });
  for (const { lang, file } of picked) {
    const problem = flyerFileError(file);
    if (problem) throw new FlyerUploadError("presign", `${LANG_LABEL[lang]} flyer: ${problem}`);
  }

  const body: Record<string, unknown> = { flyerEnAlt: input.alt.en, flyerEsAlt: input.alt.es };

  if (picked.length) {
    const { uploads } = await call<{ uploads: Presigned[] }>("presign", `${api}/presign`, {
      files: picked.map(({ lang, file }) => ({ lang, type: file.type, size: file.size })),
    });
    for (const { lang, file } of picked) {
      const target = uploads?.find((u) => u.lang === lang);
      const label = LANG_LABEL[lang];
      if (!target) {
        await report("presign", { lang, message: "no upload URL returned" });
        throw new FlyerUploadError("presign", `${label} flyer: could not start the upload.`);
      }
      let put: Response;
      try {
        put = await doFetch(target.url, { method: "PUT", headers: target.headers, body: file });
      } catch (e) {
        await report("upload", { lang, message: `network or CORS error: ${(e as Error).message}` });
        throw new FlyerUploadError("upload", `${label} flyer: the file could not be sent to storage. Check your connection. If it keeps happening, the storage bucket's CORS settings must allow this website.`);
      }
      if (!put.ok) {
        const code = /<Code>([A-Za-z0-9]+)<\/Code>/.exec(await put.text().catch(() => ""))?.[1] ?? "unknown";
        await report("upload", { lang, httpStatus: put.status, message: `storage refused the file: ${code}` });
        throw new FlyerUploadError("upload", `${label} flyer: storage refused the file (HTTP ${put.status}, ${code}). Nothing was changed.`);
      }
      body[lang === "en" ? "flyerEn" : "flyerEs"] = { key: target.key, name: file.name };
    }
  }

  return call<SavedFlyers>("finalize", api, body);
}
