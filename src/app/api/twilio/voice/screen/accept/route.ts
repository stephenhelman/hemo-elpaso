import { twilioWebhook } from "@/lib/twilio/webhook";
import { screenAnswer } from "@/lib/phone/ivr";
import { isOptionKey } from "@/lib/phone/definitions";

export const dynamic = "force-dynamic";

/** The key pressed during screening. */
export const POST = twilioWebhook(({ params, query, twiml }) => {
  const o = query.get("o");
  return isOptionKey(o) ? screenAnswer(twiml(), params.Digits, o) : twiml().hangup();
});
