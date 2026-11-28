import { twilioWebhook } from "@/lib/twilio/webhook";
import { closed, voicemailPrompt } from "@/lib/phone/ivr";
import { offerVoicemail } from "@/lib/phone/voicemail";
import { isOptionKey } from "@/lib/phone/definitions";
import { phoneSystemOn } from "@/lib/phone/system";

export const dynamic = "force-dynamic";

/** The voicemail greeting and the beep, within the caller's daily limit. Never while the phone system is off. */
export const POST = twilioWebhook(async ({ params, query, twiml }) => {
  const o = query.get("o");
  if (!isOptionKey(o)) return twiml().hangup();
  if (!(await phoneSystemOn())) return closed(twiml());
  return voicemailPrompt(twiml(), o, await offerVoicemail({ callSid: params.CallSid, from: params.From, option: o }));
});
