import { twilioWebhook } from "@/lib/twilio/webhook";
import { voicemailPrompt } from "@/lib/phone/ivr";
import { offerVoicemail } from "@/lib/phone/voicemail";
import { isOptionKey } from "@/lib/phone/definitions";

export const dynamic = "force-dynamic";

/** The voicemail greeting and the beep, within the caller's daily limit. */
export const POST = twilioWebhook(async ({ params, query, twiml }) => {
  const o = query.get("o");
  if (!isOptionKey(o)) return twiml().hangup();
  return voicemailPrompt(twiml(), o, await offerVoicemail({ callSid: params.CallSid, from: params.From, option: o }));
});
