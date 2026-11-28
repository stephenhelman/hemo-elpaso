import { twilioWebhook } from "@/lib/twilio/webhook";
import { recordingReported } from "@/lib/phone/voicemail";
import { isOptionKey } from "@/lib/phone/definitions";

export const dynamic = "force-dynamic";

/** Recording status callback: the message is ready, or there is none. Safe to receive twice. */
export const POST = twilioWebhook(async ({ params, query, twiml }) => {
  const o = query.get("o");
  const duration = Number(params.RecordingDuration ?? "");
  await recordingReported({
    callSid: params.CallSid,
    recordingSid: params.RecordingSid || null,
    status: params.RecordingStatus,
    durationSeconds: params.RecordingDuration && Number.isInteger(duration) && duration >= 0 ? duration : null,
    option: isOptionKey(o) ? o : null,
  });
  return twiml();
});
