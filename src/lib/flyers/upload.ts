/**
 * Saving a flyer, server side. The file never passes through this server (a Vercel function refuses request bodies over
 * 4.5 MB, below the 10 MB flyer limit):
 *   1. presign   the browser asks for a short-lived URL into the private uploads/tmp/ area
 *   2. upload    the browser PUTs the file straight to R2 (lib/flyers/upload-client.ts)
 *   3. finalize  this server confirms the object is there, copies it to flyers/<eventId>/, THEN writes the event row
 * The old file is deleted only after the row points at the new one. Every failure is logged with its step.
 * Storage and database are passed in so this can be tested without either (scripts/check-flyer-upload.ts).
 */
import { randomUUID } from "crypto";
import { prisma } from "@/lib/db";
import { copyInR2, deleteManyFromR2, generateFileKey, headR2, presignPut, r2PublicUrl } from "@/lib/r2";
import { TMP_PREFIX } from "@/lib/photos/keys";
import { cleanAlt, flyerFileError, LANG_LABEL, type Lang } from "./index";
import { logFlyerFailure, type FlyerStep } from "./log";

export interface FlyerStorage {
  presignPut(key: string, contentType: string, size: number, expiresInSeconds: number): Promise<string>;
  head(key: string): Promise<{ size: number; contentType: string } | null>;
  copy(from: string, to: string): Promise<void>;
  remove(keys: string[]): Promise<void>;
  publicUrl(key: string): string;
}

export interface FlyerRow { flyerEnUrl: string | null; flyerEsUrl: string | null }
export interface FlyerChanges { flyerEnUrl?: string; flyerEsUrl?: string; flyerEnAlt?: string | null; flyerEsAlt?: string | null }
export interface FlyerStore {
  find(eventId: string): Promise<FlyerRow | null>;
  save(eventId: string, changes: FlyerChanges): Promise<void>;
}

export interface FlyerDeps { storage: FlyerStorage; store: FlyerStore }

export const flyerDeps: FlyerDeps = {
  storage: { presignPut, head: headR2, copy: copyInR2, remove: deleteManyFromR2, publicUrl: r2PublicUrl },
  store: {
    find: (id) => prisma.event.findUnique({ where: { id }, select: { flyerEnUrl: true, flyerEsUrl: true } }),
    save: async (id, data) => { await prisma.event.update({ where: { id }, data }); },
  },
};

export type FlyerFailure = { ok: false; status: number; step: FlyerStep; error: string };

const LANGS: Lang[] = ["en", "es"];
const FIELD = { en: "flyerEn", es: "flyerEs" } as const;
const URL_FIELD = { en: "flyerEnUrl", es: "flyerEsUrl" } as const;
const EXTENSION: Record<string, string> = { "image/png": "png", "image/jpeg": "jpg", "application/pdf": "pdf" };

const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
export const newFlyerTmpKey = (eventId: string) => `${TMP_PREFIX}${eventId}/flyer-${randomUUID()}`;
/** True only for a flyer upload key issued for this event (shape check; the object must also exist). */
export const isFlyerTmpKeyFor = (eventId: string, key: string) => {
  const prefix = `${TMP_PREFIX}${eventId}/flyer-`;
  return key.startsWith(prefix) && new RegExp(`^${UUID}$`).test(key.slice(prefix.length));
};

/** "en-<name>.<ext>": the extension follows the stored content type, because isPdfUrl() decides by extension. */
export function flyerFileName(lang: Lang, name: unknown, contentType: string): string {
  const base = (typeof name === "string" ? name : "").replace(/\.(png|jpe?g|pdf)$/i, "").slice(0, 60) || "flyer";
  return `${lang}-${base}.${EXTENSION[contentType]}`;
}

/** The R2 key of a stored flyer URL, whatever host it was saved under. null = not one of this event's flyers. */
export function flyerKeyFromUrl(eventId: string, url: string): string | null {
  try {
    const path = decodeURIComponent(new URL(url).pathname);
    const at = path.indexOf(`/flyers/${eventId}/`);
    return at === -1 ? null : path.slice(at + 1);
  } catch {
    return null;
  }
}

function fail(eventId: string, step: FlyerStep, status: number, error: string, cause?: unknown, lang?: Lang): FlyerFailure {
  logFlyerFailure(step, { eventId, lang, httpStatus: status }, cause ?? error);
  return { ok: false, status, step, error };
}

/** Storage errors are named for the board member ("AccessDenied", "NoSuchBucket"): it says what to fix. */
const reason = (e: unknown) => (e instanceof Error && e.name !== "Error" ? ` (${e.name})` : "");

export type PresignResult = { ok: true; uploads: { lang: Lang; key: string; url: string; headers: Record<string, string> }[] } | FlyerFailure;

export async function presignFlyers(eventId: string, body: unknown, deps: FlyerDeps = flyerDeps): Promise<PresignResult> {
  const files = (body as { files?: unknown } | null)?.files;
  if (!Array.isArray(files) || files.length === 0 || files.length > LANGS.length) return fail(eventId, "presign", 400, "No flyer file to upload");

  const wanted: { lang: Lang; type: string; size: number }[] = [];
  for (const f of files as { lang?: unknown; type?: unknown; size?: unknown }[]) {
    const lang = LANGS.find((l) => l === f?.lang);
    if (!lang || wanted.some((w) => w.lang === lang)) return fail(eventId, "presign", 400, "One flyer per language");
    const type = typeof f.type === "string" ? f.type : "";
    const size = Number(f.size);
    const problem = flyerFileError({ type, size });
    if (problem) return fail(eventId, "presign", 400, `${LANG_LABEL[lang]} flyer: ${problem}`, undefined, lang);
    wanted.push({ lang, type, size });
  }

  try {
    if (!(await deps.store.find(eventId))) return fail(eventId, "presign", 404, "Event not found");
  } catch (e) {
    return fail(eventId, "db", 500, "Could not read the event from the database. Try again.", e);
  }

  try {
    const uploads = await Promise.all(
      wanted.map(async ({ lang, type, size }) => {
        const key = newFlyerTmpKey(eventId);
        return { lang, key, url: await deps.storage.presignPut(key, type, size, 300), headers: { "Content-Type": type } };
      }),
    );
    return { ok: true, uploads };
  } catch (e) {
    return fail(eventId, "presign", 500, `Could not prepare the upload${reason(e)}. Nothing was changed.`, e);
  }
}

export type FinalizeResult = ({ ok: true; changed: string[] } & FlyerRow & Pick<FlyerChanges, "flyerEnAlt" | "flyerEsAlt">) | FlyerFailure;

export async function finalizeFlyers(eventId: string, body: unknown, deps: FlyerDeps = flyerDeps): Promise<FinalizeResult> {
  if (!body || typeof body !== "object") return fail(eventId, "finalize", 400, "This page is out of date. Reload it and try again.");
  const input = body as Record<string, unknown>;

  const uploads: { lang: Lang; key: string; name: unknown }[] = [];
  for (const lang of LANGS) {
    const u = input[FIELD[lang]] as { key?: unknown; name?: unknown } | undefined;
    if (!u) continue;
    const key = typeof u.key === "string" ? u.key : "";
    if (!isFlyerTmpKeyFor(eventId, key)) return fail(eventId, "finalize", 400, "Invalid upload key. Choose the file again.", undefined, lang);
    uploads.push({ lang, key, name: u.name });
  }

  // Alt text: only touched when the field is sent.
  const changes: FlyerChanges = {};
  if ("flyerEnAlt" in input) changes.flyerEnAlt = cleanAlt(input.flyerEnAlt);
  if ("flyerEsAlt" in input) changes.flyerEsAlt = cleanAlt(input.flyerEsAlt);
  if (uploads.length === 0 && Object.keys(changes).length === 0) return fail(eventId, "finalize", 400, "Nothing to save");

  /** Best-effort delete: a leftover object is logged, never a reason to fail a save. */
  const discard = async (keys: string[]) => {
    if (keys.length === 0) return;
    await deps.storage.remove(keys).catch((e) => logFlyerFailure("cleanup", { eventId }, e));
  };

  try {
    let event: FlyerRow | null;
    try {
      event = await deps.store.find(eventId);
    } catch (e) {
      return fail(eventId, "db", 500, "Could not read the event from the database. Nothing was changed.", e);
    }
    if (!event) return fail(eventId, "finalize", 404, "Event not found");

    // Confirm every upload and put it in place BEFORE touching the row.
    const copied: string[] = [];
    const replaced: string[] = [];
    for (const { lang, key, name } of uploads) {
      const label = LANG_LABEL[lang];
      try {
        const uploaded = await deps.storage.head(key);
        const problem = uploaded ? flyerFileError({ type: uploaded.contentType, size: uploaded.size }) : "the file did not arrive in storage";
        if (!uploaded || problem) {
          await discard(copied);
          return fail(eventId, "finalize", uploaded ? 422 : 409, `${label} flyer: ${problem}. Nothing was changed.`, undefined, lang);
        }
        const finalKey = generateFileKey(`flyers/${eventId}`, flyerFileName(lang, name, uploaded.contentType));
        await deps.storage.copy(key, finalKey);
        copied.push(finalKey);
        if ((await deps.storage.head(finalKey))?.size !== uploaded.size) throw new Error("the stored copy is missing or incomplete");
        changes[URL_FIELD[lang]] = deps.storage.publicUrl(finalKey);
        const old = event[URL_FIELD[lang]];
        const oldKey = old ? flyerKeyFromUrl(eventId, old) : null;
        if (oldKey) replaced.push(oldKey);
      } catch (e) {
        await discard(copied);
        return fail(eventId, "finalize", 502, `${label} flyer: file storage failed${reason(e)}. Nothing was changed.`, e, lang);
      }
    }

    try {
      await deps.store.save(eventId, changes);
    } catch (e) {
      // The copies are left in place: if the write did land despite the error, the row must not point at a missing
      // file. Deleting the event removes the whole folder.
      return fail(eventId, "db", 500, "The file was uploaded but the event could not be saved (database error). Try again.", e);
    }
    await discard(replaced);

    return {
      ok: true,
      changed: [...uploads.map((u) => FIELD[u.lang]), ...Object.keys(changes).filter((k) => k.endsWith("Alt"))],
      flyerEnUrl: changes.flyerEnUrl ?? event.flyerEnUrl,
      flyerEsUrl: changes.flyerEsUrl ?? event.flyerEsUrl,
      ...("flyerEnAlt" in changes ? { flyerEnAlt: changes.flyerEnAlt } : {}),
      ...("flyerEsAlt" in changes ? { flyerEsAlt: changes.flyerEsAlt } : {}),
    };
  } finally {
    await discard(uploads.map((u) => u.key)); // temporary uploads never outlive the request
  }
}
