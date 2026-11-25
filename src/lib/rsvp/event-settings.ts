import { cleanLinkUrl, MEET_HOSTS, YOUTUBE_HOSTS } from "./request-rules";

/**
 * The per-event RSVP settings from the event form: whether uninvited households may ask to attend, and the virtual option
 * (a Google Meet link and a YouTube link). Virtual can be switched ON only while the "recordings" toggle is on (live streams
 * are a "not yet available" part of the privacy policy until then) and with both links set. An event that is ALREADY virtual
 * keeps its setting when the toggle later goes off, so unrelated edits are never blocked; confirming virtual is blocked instead.
 */
export type EventRequestSettings = { allowUninvitedRequests?: boolean; virtualEnabled?: boolean; meetUrl?: string | null; youtubeUrl?: string | null };

export function eventRequestSettings(
  body: Record<string, unknown>,
  ctx: { recordingsOn: boolean; current?: { virtualEnabled: boolean } | null },
): { ok: true; data: EventRequestSettings } | { ok: false; error: string } {
  const data: EventRequestSettings = {};
  if (typeof body.allowUninvitedRequests === "boolean") data.allowUninvitedRequests = body.allowUninvitedRequests;

  const meetRaw = typeof body.meetUrl === "string" ? body.meetUrl.trim() : null;
  const ytRaw = typeof body.youtubeUrl === "string" ? body.youtubeUrl.trim() : null;
  if (meetRaw !== null) {
    if (meetRaw === "") data.meetUrl = null;
    else { const u = cleanLinkUrl(meetRaw, MEET_HOSTS); if (!u) return { ok: false, error: "The Meet link must be an https://meet.google.com link" }; data.meetUrl = u; }
  }
  if (ytRaw !== null) {
    if (ytRaw === "") data.youtubeUrl = null;
    else { const u = cleanLinkUrl(ytRaw, YOUTUBE_HOSTS); if (!u) return { ok: false, error: "The YouTube link must be an https://youtube.com or youtu.be link" }; data.youtubeUrl = u; }
  }
  if (typeof body.virtualEnabled === "boolean") {
    const turningOn = body.virtualEnabled && !ctx.current?.virtualEnabled;
    if (turningOn && !ctx.recordingsOn) return { ok: false, error: "Virtual attendance can't be turned on until the board turns on the \"recordings\" feature." };
    data.virtualEnabled = body.virtualEnabled;
  }
  return { ok: true, data };
}

/** After merging with what is stored: virtual on needs both links. */
export function virtualLinksMissing(final: { virtualEnabled: boolean; meetUrl: string | null; youtubeUrl: string | null }): boolean {
  return final.virtualEnabled && (!final.meetUrl || !final.youtubeUrl);
}
