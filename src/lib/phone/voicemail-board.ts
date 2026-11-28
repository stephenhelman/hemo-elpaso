/**
 * What the President and Vice President do with voicemail (permission canListenVoicemail; the routes check it): list,
 * play, see a caller's number, mark handled, find a caller's messages. Deleting is in ./voicemail.ts.
 * Numbers leave the server MASKED, except one at a time through revealCaller(), which is audited.
 */
import { AuditAction } from "@prisma/client";
import { prisma } from "@/lib/db";
import { auditData } from "@/lib/audit";
import type { RestFailure } from "@/lib/twilio/client";
import { callerDataReady, callerHash, decryptCaller, displayNumber, maskedCaller, typedNumber } from "./caller";
import { OPTIONS, VOICEMAIL_RETENTION_DAYS, isOptionKey } from "./definitions";
import { MEDIA_OPEN_KEY, voicemailDeps, type VoicemailDeps } from "./voicemail";

export interface VoicemailItem {
  id: string;
  receivedAt: string;
  mailbox: { en: string; es: string };
  language: string;
  durationSeconds: number | null;
  /** Masked, or null (hidden, or it can't be read). */
  caller: string | null;
  listenedAt: string | null;
  handledAt: string | null;
  handledBy: string | null;
}
export interface VoicemailView {
  items: VoicemailItem[];
  /** False: PHONE_DATA_KEY is missing, so callers can't leave messages. */
  canReceive: boolean;
  /** Audio was reachable without signing in at the last check. */
  audioUnprotected: boolean;
  /** Messages past the retention limit that could not be deleted yet. */
  overdue: number;
}

export async function voicemailView(now = new Date()): Promise<VoicemailView> {
  const rows = await prisma.phoneVoicemail.findMany({ where: { status: "ready" }, orderBy: { createdAt: "desc" }, take: 500 });
  const ids = Array.from(new Set(rows.map((r) => r.handledById).filter((x): x is string => !!x)));
  const people = await prisma.patient.findMany({ where: { id: { in: ids } }, select: { id: true, contactProfile: { select: { firstName: true, lastName: true } } } });
  const name = (id: string | null) => {
    const c = people.find((p) => p.id === id)?.contactProfile;
    return c ? `${c.firstName} ${c.lastName}`.trim() : null;
  };
  const limit = new Date(now.getTime() - VOICEMAIL_RETENTION_DAYS * 86_400_000);
  return {
    items: rows.map((r) => ({
      id: r.id,
      receivedAt: (r.receivedAt ?? r.createdAt).toISOString(),
      mailbox: isOptionKey(r.mailbox) ? OPTIONS[r.mailbox].label : { en: r.mailbox, es: r.mailbox },
      language: r.language,
      durationSeconds: r.durationSeconds,
      caller: maskedCaller(r.callerEnc),
      listenedAt: r.listenedAt?.toISOString() ?? null,
      handledAt: r.handledAt?.toISOString() ?? null,
      handledBy: name(r.handledById),
    })),
    canReceive: callerDataReady(),
    audioUnprotected: !!(await prisma.appSetting.findUnique({ where: { key: MEDIA_OPEN_KEY }, select: { key: true } })),
    overdue: rows.filter((r) => r.createdAt < limit).length,
  };
}

const PLAY_ID = /^[A-Za-z0-9-]{8,64}$/;
/** The several range requests of one press of Play carry the same id and are one play. */
export const SAME_PLAY_MS = 10 * 60_000;

export type PlayResult = { ok: true; audio: Uint8Array } | { ok: false; error: RestFailure["error"] };

/**
 * The audio of one message, for one board member. Every play is audited BEFORE the audio is handed over (if the audit
 * can't be written, nothing is played). A request without a play id is always audited on its own.
 */
export async function playVoicemail(id: string, i: { actorId: string; playId: string | null }, deps: VoicemailDeps = voicemailDeps(), now = new Date()): Promise<PlayResult> {
  const row = await prisma.phoneVoicemail.findUnique({ where: { id } });
  if (!row || row.status !== "ready" || !row.recordingSid) return { ok: false, error: "not_found" };
  const media = await deps.recordings.media(row.recordingSid);
  if (!media.ok) return media;

  const play = i.playId && PLAY_ID.test(i.playId) ? i.playId : null;
  const seen = play
    ? await prisma.auditLog.findFirst({
        where: { action: AuditAction.VOICEMAIL_PLAYED, resourceId: id, patientId: i.actorId, createdAt: { gte: new Date(now.getTime() - SAME_PLAY_MS) }, changes: { path: ["play"], equals: play } },
        select: { id: true },
      })
    : null;
  if (!seen) {
    await prisma.auditLog.create({
      data: auditData({ actorType: "board", actorPatientId: i.actorId, action: AuditAction.VOICEMAIL_PLAYED, resourceType: "PhoneVoicemail", resourceId: id, details: "Voicemail played", changes: { play } }),
    });
  }
  await prisma.phoneVoicemail.updateMany({ where: { id, listenedAt: null }, data: { listenedAt: now, listenedById: i.actorId } });
  return media;
}

export type RevealResult = { ok: true; number: string } | { ok: false; error: "not_found" | "no_number" };

/**
 * One caller's full number, to call them back. Decrypted only now, and the view is audited BEFORE the number is handed
 * over (if the audit can't be written, nothing is shown). The audit row names the message, never the number.
 */
export async function revealCaller(id: string, actorId: string): Promise<RevealResult> {
  const row = await prisma.phoneVoicemail.findUnique({ where: { id }, select: { status: true, callerEnc: true } });
  if (!row || row.status !== "ready") return { ok: false, error: "not_found" };
  const number = decryptCaller(row.callerEnc);
  if (!number) return { ok: false, error: "no_number" }; // hidden by the caller, or the key changed
  await prisma.auditLog.create({
    data: auditData({ actorType: "board", actorPatientId: actorId, action: AuditAction.VOICEMAIL_CALLER_VIEWED, resourceType: "PhoneVoicemail", resourceId: id, details: "Voicemail caller number viewed" }),
  });
  return { ok: true, number: displayNumber(number) };
}

export async function setHandled(id: string, handled: boolean, actorId: string, now = new Date()): Promise<boolean> {
  return prisma.$transaction(async (tx) => {
    const done = await tx.phoneVoicemail.updateMany({
      where: { id, status: "ready" }, data: { handledAt: handled ? now : null, handledById: handled ? actorId : null },
    });
    if (done.count !== 1) return false;
    await tx.auditLog.create({
      data: auditData({ actorType: "board", actorPatientId: actorId, action: AuditAction.VOICEMAIL_HANDLED, resourceType: "PhoneVoicemail", resourceId: id, details: "Voicemail handled", changes: { handled } }),
    });
    return true;
  });
}

export type FindResult = { ok: true; ids: string[] } | { ok: false; error: "invalid" | "unavailable" };

/** The messages from one number (to delete them when the caller asks). The number is matched by its hash, never kept. */
export async function findByCaller(input: unknown, actorId: string): Promise<FindResult> {
  const number = typedNumber(input);
  if (!number) return { ok: false, error: "invalid" };
  const hash = callerHash(number);
  if (!hash) return { ok: false, error: "unavailable" };
  const rows = await prisma.phoneVoicemail.findMany({ where: { callerHash: hash, status: "ready" }, select: { id: true } });
  await prisma.auditLog.create({
    data: auditData({ actorType: "board", actorPatientId: actorId, action: AuditAction.VOICEMAIL_SEARCHED, resourceType: "PhoneVoicemail", details: "Voicemail searched by number", changes: { matches: rows.length } }),
  });
  return { ok: true, ids: rows.map((r) => r.id) };
}
