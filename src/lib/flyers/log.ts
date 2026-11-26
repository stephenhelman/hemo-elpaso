/**
 * One log line shape for every failure while saving a flyer: "[flyers] <step> failed". Ids, step and error only:
 * no file names, and any URL inside an error message is removed (a presigned URL is a temporary credential).
 */
export const FLYER_STEPS = ["auth", "presign", "upload", "finalize", "db", "cleanup", "audit"] as const;
export type FlyerStep = (typeof FLYER_STEPS)[number];

export const isFlyerStep = (v: unknown): v is FlyerStep => typeof v === "string" && (FLYER_STEPS as readonly string[]).includes(v);

export const safeLogText = (v: string) => v.replace(/https?:\/\/\S+/g, "[url]").replace(/\s+/g, " ").trim().slice(0, 500);

const describe = (e: unknown) => safeLogText(e instanceof Error ? `${e.name}: ${e.message}` : String(e));

export interface FlyerLogContext { eventId: string; lang?: string; httpStatus?: number; reportedBy?: "browser" }

export function logFlyerFailure(step: FlyerStep, context: FlyerLogContext, error: unknown): void {
  console.error(`[flyers] ${step} failed`, { ...context, error: describe(error) });
}
