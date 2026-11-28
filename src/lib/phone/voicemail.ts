/**
 * Voicemail, from the offer to the deletion. The AUDIO never leaves the phone provider except to be played to the
 * President or Vice President (./voicemail-board.ts). Our row (phone_voicemails) holds ids, codes, times and the
 * caller's number encrypted.
 *
 *   offerVoicemail     webhook: may this caller leave a message? Makes the "pending" row, within the daily limits.
 *   recordingReported  webhook: the recording is ready (-> "ready", the officers are emailed a link) or there is none.
 *   deleteVoicemail    the provider FIRST, the row only after it confirms. A failure leaves the row to be retried.
 *   runVoicemailRetention  daily: expire, retry, recover lost callbacks, delete recordings we have no use for.
 *
 * Nothing here logs a number, an audio address or an error message from the provider.
 */
import { AuditAction, type PhoneVoicemail } from "@prisma/client";
import { prisma } from "@/lib/db";
import { auditData } from "@/lib/audit";
import { sendLoggedEmail } from "@/lib/email/send";
import { getRouteRecipients } from "@/lib/email-routing";
import { siteUrl } from "@/lib/site";
import { RECORDING_SID, twilioRecordings, type RecordingInfo, type RecordingStore, type RestFailure } from "@/lib/twilio/client";
import { callerDataReady, callerHash, callerNumber, encryptCaller } from "./caller";
import {
  OPTIONS, VOICEMAIL_DAILY_LIMIT, VOICEMAIL_MIN_SECONDS, VOICEMAIL_ORPHAN_HOURS, VOICEMAIL_RECORD_DAYS, VOICEMAIL_RETENTION_DAYS,
  VOICEMAIL_TOTAL_DAILY_LIMIT, VOICEMAIL_UNKNOWN_DAILY_LIMIT, isOptionKey, type OptionKey,
} from "./definitions";

const HOUR = 3_600_000, DAY = 24 * HOUR;
const CALL_SID = /^CA[0-9a-fA-F]{32}$/;
export const MEDIA_OPEN_KEY = "phone.media_open";

export interface VoicemailDeps {
  recordings: RecordingStore;
  /** Waits between delete attempts (checks pass a no-op). */
  sleep: (ms: number) => Promise<void>;
}
export const voicemailDeps = (): VoicemailDeps => ({ recordings: twilioRecordings(), sleep: (ms) => new Promise((r) => setTimeout(r, ms)) });

const languageOf = (o: OptionKey) => OPTIONS[o].languages.join("+");
const errorName = (e: unknown) => (e instanceof Error ? e.name : "unknown");

// ── offering ──────────────────────────────────────────────────────────────────────────────────────────────────
/**
 * True = play the greeting and record. False (over a limit, no PHONE_DATA_KEY, database trouble) = the "call again"
 * message. Never throws: a caller must always hear something.
 */
export async function offerVoicemail(i: { callSid: string | undefined; from: string | undefined; option: OptionKey }, now = new Date()): Promise<boolean> {
  const callSid = i.callSid ?? "";
  if (!CALL_SID.test(callSid)) return false;
  if (!callerDataReady()) {
    console.error("[voicemail] PHONE_DATA_KEY is missing or not 64 hex characters: no voicemail is offered");
    return false;
  }
  try {
    const number = callerNumber(i.from);
    const hash = callerHash(number)!;
    return await prisma.$transaction(async (tx) => {
      // one offer at a time, so parallel calls can't pass the limit together
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('phone.voicemail'))`;
      const existing = await tx.phoneVoicemail.findUnique({ where: { callSid }, select: { status: true } });
      if (existing) return existing.status === "pending"; // the same request again
      const since = new Date(now.getTime() - DAY);
      const mine = await tx.phoneVoicemail.count({ where: { callerHash: hash, createdAt: { gt: since } } });
      const all = await tx.phoneVoicemail.count({ where: { createdAt: { gt: since } } });
      if (mine >= (number ? VOICEMAIL_DAILY_LIMIT : VOICEMAIL_UNKNOWN_DAILY_LIMIT) || all >= VOICEMAIL_TOTAL_DAILY_LIMIT) {
        console.warn("[voicemail] daily limit reached", { scope: all >= VOICEMAIL_TOTAL_DAILY_LIMIT ? "all callers" : "one caller" });
        return false;
      }
      await tx.phoneVoicemail.create({
        data: { callSid, mailbox: i.option, language: languageOf(i.option), callerHash: hash, callerEnc: number ? encryptCaller(number) : null, createdAt: now },
      });
      return true;
    });
  } catch (e) {
    console.error("[voicemail] could not offer voicemail", { error: errorName(e) });
    return false;
  }
}

// ── the recording callback ────────────────────────────────────────────────────────────────────────────────────
export interface RecordingReport {
  callSid: string | undefined;
  recordingSid: string | null;
  /** completed | absent | failed (anything else is ignored) */
  status: string | undefined;
  durationSeconds: number | null;
  option: OptionKey | null;
}
export type ReportOutcome = "stored" | "no_message" | "duplicate" | "ignored";

export async function recordingReported(r: RecordingReport, deps: VoicemailDeps = voicemailDeps(), now = new Date()): Promise<ReportOutcome> {
  const callSid = r.callSid ?? "";
  if (!CALL_SID.test(callSid) || !["completed", "absent", "failed"].includes(r.status ?? "")) return "ignored";
  if (r.recordingSid && !RECORDING_SID.test(r.recordingSid)) return "ignored";

  let row = await prisma.phoneVoicemail.findUnique({ where: { callSid } });
  if (!row) {
    // We have no row (it could not be saved, or was restored away): keep the message anyway, without a caller number.
    if (!r.option) return "ignored";
    row = await prisma.phoneVoicemail.upsert({ where: { callSid }, update: {}, create: { callSid, mailbox: r.option, language: languageOf(r.option), createdAt: now } });
  }
  if (row.status === "deleted") {
    if (r.status === "completed" && r.recordingSid) await deps.recordings.remove(r.recordingSid); // arrived late: not wanted
    return "ignored";
  }
  if (row.status === "ready") return "duplicate";

  const tooShort = r.durationSeconds !== null && r.durationSeconds < VOICEMAIL_MIN_SECONDS;
  if (r.status === "completed" && r.recordingSid && !tooShort) {
    const stored = await prisma.$transaction(async (tx) => {
      const won = await tx.phoneVoicemail.updateMany({
        where: { id: row.id, status: "pending" },
        data: { status: "ready", recordingSid: r.recordingSid, durationSeconds: r.durationSeconds, receivedAt: now },
      });
      if (won.count !== 1) return false;
      await tx.auditLog.create({ data: auditData({ actorType: "system", action: AuditAction.VOICEMAIL_RECEIVED, resourceType: "PhoneVoicemail", resourceId: row.id, details: "Voicemail", changes: { mailbox: row.mailbox } }) });
      return true;
    });
    if (!stored) return "duplicate";
    await sendVoicemailNotice(row.id, now);
    await checkMediaProtection(r.recordingSid, deps);
    return "stored";
  }

  // a hang-up or silence: nothing to keep
  if (r.recordingSid) {
    await prisma.phoneVoicemail.update({ where: { id: row.id }, data: { recordingSid: r.recordingSid, durationSeconds: r.durationSeconds ?? 0 } });
  }
  // "absent" and "failed" have no audio to delete (the daily sweep removes anything the provider does list)
  if (r.status === "completed" && r.recordingSid) await deleteVoicemail(row.id, { reason: "no_message" }, deps, now);
  else await markDeleted(row.id, { reason: "no_message" }, now);
  return "no_message";
}

/** Email President and Vice President (route phone.voicemail): that there is a message, and a link. Nothing else. */
export async function sendVoicemailNotice(id: string, now = new Date()): Promise<boolean> {
  // claim it first, so two callbacks can't send it twice; give the claim back if the send fails (the daily job retries)
  const claim = await prisma.phoneVoicemail.updateMany({ where: { id, status: "ready", noticeSentAt: null }, data: { noticeSentAt: now } });
  if (claim.count !== 1) return false;
  let sent = false;
  try {
    const link = `${siteUrl()}/admin/voicemails`;
    const res = await sendLoggedEmail({
      kind: "VOICEMAIL_NOTICE", sender: "noreply", to: await getRouteRecipients("phone.voicemail"), subject: "New voicemail / Nuevo mensaje de voz",
      html: `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5;color:#222"><p>New voicemail · Nuevo mensaje de voz</p><p><a href="${link}">${link}</a></p></div>`,
    });
    sent = res.ok;
  } catch (e) {
    console.error("[voicemail] notice failed", { error: errorName(e) });
  }
  if (!sent) await prisma.phoneVoicemail.updateMany({ where: { id }, data: { noticeSentAt: null } });
  return sent;
}

/** Remember (and warn) if audio can be fetched without signing in: "Enforce HTTP Auth on Media URLs" is off. */
export async function checkMediaProtection(recordingSid: string, deps: VoicemailDeps, now = new Date()): Promise<void> {
  try {
    const open = await deps.recordings.openToPublic(recordingSid);
    if (open === true) {
      console.error("[voicemail] RECORDING AUDIO IS NOT PROTECTED: turn on HTTP authentication for media in the phone provider's Voice settings");
      await prisma.appSetting.upsert({ where: { key: MEDIA_OPEN_KEY }, create: { key: MEDIA_OPEN_KEY, value: { at: now.toISOString() } }, update: { value: { at: now.toISOString() } } });
    } else if (open === false) {
      await prisma.appSetting.deleteMany({ where: { key: MEDIA_OPEN_KEY } });
    }
  } catch (e) {
    console.error("[voicemail] media protection check failed", { error: errorName(e) });
  }
}

// ── deletion ──────────────────────────────────────────────────────────────────────────────────────────────────
export type DeleteReason = "retention" | "manual" | "no_message";
export interface Why { reason: DeleteReason; /** the board member, for a manual deletion */ actorId?: string }

/** The row after the audio is gone: no number left on it. (A hang-up keeps only the hash, for one day's limit.) */
async function markDeleted(id: string, why: Why, now: Date): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const done = await tx.phoneVoicemail.updateMany({
      where: { id, status: { not: "deleted" } },
      data: { status: "deleted", deletedAt: now, deletedReason: why.reason, deletedById: why.actorId ?? null, callerEnc: null, ...(why.reason === "no_message" ? {} : { callerHash: null }) },
    });
    if (done.count !== 1) return;
    await tx.auditLog.create({
      data: auditData({
        actorType: why.actorId ? "board" : "system", actorPatientId: why.actorId ?? null, action: AuditAction.VOICEMAIL_DELETED,
        resourceType: "PhoneVoicemail", resourceId: id, details: "Voicemail deleted", changes: { reason: why.reason },
      }),
    });
  });
}

export const DELETE_ATTEMPTS = 3;
export type DeleteResult = { ok: true } | { ok: false; error: RestFailure["error"] };

/** Delete at the provider, then mark the row. If the provider doesn't confirm, the row stays as it was. */
export async function deleteVoicemail(id: string, why: Why, deps: VoicemailDeps = voicemailDeps(), now = new Date()): Promise<DeleteResult> {
  const row = await prisma.phoneVoicemail.findUnique({ where: { id } });
  if (!row || row.status === "deleted") return { ok: false, error: "not_found" };
  if (row.recordingSid) {
    let res = await deps.recordings.remove(row.recordingSid);
    for (let i = 1; i < DELETE_ATTEMPTS && !res.ok && res.error === "failed"; i++) {
      await deps.sleep(i * 500);
      res = await deps.recordings.remove(row.recordingSid);
    }
    if (!res.ok) {
      await prisma.phoneVoicemail.update({ where: { id }, data: { deleteAttempts: { increment: 1 } } });
      return res;
    }
  }
  await markDeleted(id, why, now);
  return { ok: true };
}

// ── the daily job ─────────────────────────────────────────────────────────────────────────────────────────────
export interface RetentionSummary {
  expired: number; noMessage: number; recovered: number; orphans: number; notices: number; records: number; failed: number;
  /** Why nothing could be asked of the provider. */
  skipped: "captured" | "not_configured" | null;
}

/** A voicemail is deleted once keeping it until tomorrow's run would pass the limit. */
export const expiryCutoff = (now: Date) => new Date(now.getTime() - (VOICEMAIL_RETENTION_DAYS - 1) * DAY);

export async function runVoicemailRetention(now = new Date(), deps: VoicemailDeps = voicemailDeps()): Promise<RetentionSummary> {
  const s: RetentionSummary = { expired: 0, noMessage: 0, recovered: 0, orphans: 0, notices: 0, records: 0, failed: 0, skipped: null };
  const cutoff = expiryCutoff(now);
  const stale = new Date(now.getTime() - VOICEMAIL_ORPHAN_HOURS * HOUR);

  // 1. expired messages, and hang-ups whose deletion failed earlier. A failure stays for tomorrow.
  const due = await prisma.phoneVoicemail.findMany({
    where: { OR: [{ status: "ready", createdAt: { lte: cutoff } }, { status: "pending", recordingSid: { not: null } }] },
    select: { id: true, status: true }, orderBy: { createdAt: "asc" },
  });
  for (const row of due) {
    const reason: DeleteReason = row.status === "ready" ? "retention" : "no_message";
    const res = await deleteVoicemail(row.id, { reason }, deps, now);
    if (!res.ok) { if (res.error !== "not_found") s.failed++; }
    else if (reason === "retention") s.expired++;
    else s.noMessage++;
  }

  // 2. what the provider holds
  const listed = await deps.recordings.list();
  if (!listed.ok) {
    if (listed.error === "captured" || listed.error === "not_configured") s.skipped = listed.error;
    else s.failed++;
  } else {
    await sweep(listed.items, { now, cutoff, stale }, deps, s);
    // rows that were offered a recording and never got one
    const withAudio = new Set(listed.items.map((r) => r.callSid));
    const empty = await prisma.phoneVoicemail.findMany({ where: { status: "pending", recordingSid: null, createdAt: { lt: stale } }, select: { id: true, callSid: true } });
    for (const row of empty.filter((r) => !withAudio.has(r.callSid))) { await markDeleted(row.id, { reason: "no_message" }, now); s.noMessage++; }
  }

  // 3. notices that were never sent
  const unsent = await prisma.phoneVoicemail.findMany({ where: { status: "ready", noticeSentAt: null, receivedAt: { lt: new Date(now.getTime() - 10 * 60_000) } }, select: { id: true } });
  for (const row of unsent) if (await sendVoicemailNotice(row.id, now)) s.notices++;

  // 4. what is left of deleted rows: the limit's hash goes after a day, the row after a year
  await prisma.phoneVoicemail.updateMany({ where: { status: "deleted", callerHash: { not: null }, createdAt: { lt: new Date(now.getTime() - DAY) } }, data: { callerHash: null } });
  s.records = (await prisma.phoneVoicemail.deleteMany({ where: { status: "deleted", createdAt: { lt: new Date(now.getTime() - VOICEMAIL_RECORD_DAYS * DAY) } } })).count;

  // 5. is audio still protected?
  const newest = await prisma.phoneVoicemail.findFirst({ where: { status: "ready", recordingSid: { not: null } }, orderBy: { createdAt: "desc" }, select: { recordingSid: true } });
  if (newest?.recordingSid) await checkMediaProtection(newest.recordingSid, deps, now);
  return s;
}

/**
 * Every recording at the provider should belong to a live row. One whose callback was lost is taken in; one whose row is
 * deleted, or that matches no row after a day, is deleted. Only finished recordings can be deleted there.
 */
async function sweep(items: RecordingInfo[], t: { now: Date; cutoff: Date; stale: Date }, deps: VoicemailDeps, s: RetentionSummary) {
  const rows = await prisma.phoneVoicemail.findMany({
    where: { OR: [{ callSid: { in: items.map((r) => r.callSid) } }, { recordingSid: { in: items.map((r) => r.sid) } }] },
  });
  for (const rec of items) {
    const row: PhoneVoicemail | undefined = rows.find((x) => x.recordingSid === rec.sid) ?? rows.find((x) => x.callSid === rec.callSid);
    if (row && row.status !== "deleted" && row.recordingSid === rec.sid) continue; // ours (step 1 handles its age)

    if (row && row.status === "pending" && !row.recordingSid && rec.status === "completed" && rec.createdAt > t.cutoff) {
      const outcome = await recordingReported(
        { callSid: row.callSid, recordingSid: rec.sid, status: rec.status, durationSeconds: rec.durationSeconds, option: isOptionKey(row.mailbox) ? row.mailbox : null },
        deps, t.now,
      );
      if (outcome === "stored") s.recovered++;
      else if (outcome === "no_message") s.noMessage++;
      continue;
    }

    const unwanted = row?.status === "deleted" || rec.createdAt < t.stale;
    if (!unwanted || (rec.status !== "completed" && rec.status !== "absent")) continue;
    const res = await deps.recordings.remove(rec.sid);
    if (!res.ok) { s.failed++; continue; }
    s.orphans++;
    if (row && row.status === "pending" && !row.recordingSid) await markDeleted(row.id, { reason: rec.status === "absent" ? "no_message" : "retention" }, t.now);
  }
}
