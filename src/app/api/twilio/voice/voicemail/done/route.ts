import { twilioWebhook } from "@/lib/twilio/webhook";
import { voicemailDone } from "@/lib/phone/ivr";
import { isOptionKey } from "@/lib/phone/definitions";

export const dynamic = "force-dynamic";

/** The caller finished their message. */
export const POST = twilioWebhook(({ params, query, twiml }) => {
  const o = query.get("o");
  return isOptionKey(o) ? voicemailDone(twiml(), o, params.RecordingDuration) : twiml().hangup();
});
