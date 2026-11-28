/**
 * What a browser may report about a failed flyer upload. PURE (used by both sides).
 *
 * Codes only. The server never logs text the browser sends, so nothing from a file (its name or its contents) can reach
 * the log, whatever a broken or hostile client posts.
 */
import { isFlyerStep, type FlyerStep } from "./log";
import type { Lang } from "./index";

export const CLIENT_CODES = ["network", "storage_refused", "unexpected_response", "no_upload_url"] as const;
export type ClientCode = (typeof CLIENT_CODES)[number];

/** Far above any real report (about 120 bytes). */
export const CLIENT_REPORT_MAX_BYTES = 1024;
/** Per board member. One failed save sends at most a couple. */
export const CLIENT_REPORT_LIMIT = { max: 20, windowMs: 10 * 60_000 };

export interface ClientReport {
  step: FlyerStep;
  code: ClientCode | "unknown";
  lang?: Lang;
  httpStatus?: number;
  /** The storage service's error code, such as AccessDenied: letters only. */
  storageCode?: string;
}

const STORAGE_CODE = /^[A-Za-z]{1,40}$/;

export function parseClientReport(body: unknown): ClientReport {
  const b = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  const status = b.httpStatus;
  return {
    step: isFlyerStep(b.step) ? b.step : "upload",
    code: (CLIENT_CODES as readonly unknown[]).includes(b.code) ? (b.code as ClientCode) : "unknown",
    lang: b.lang === "en" || b.lang === "es" ? b.lang : undefined,
    httpStatus: Number.isInteger(status) && (status as number) >= 100 && (status as number) <= 599 ? (status as number) : undefined,
    storageCode: typeof b.storageCode === "string" && STORAGE_CODE.test(b.storageCode) ? b.storageCode : undefined,
  };
}

/** The request body as text, or null as soon as it is longer than `max` bytes (whatever the headers claim). */
export async function readCapped(request: Request, max: number): Promise<string | null> {
  if (Number(request.headers.get("content-length") ?? 0) > max) return null;
  const reader = request.body?.getReader();
  if (!reader) return "";
  const decoder = new TextDecoder();
  let size = 0, text = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) return text + decoder.decode();
    size += value.byteLength;
    if (size > max) {
      await reader.cancel().catch(() => {});
      return null;
    }
    text += decoder.decode(value, { stream: true });
  }
}
