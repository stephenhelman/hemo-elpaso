import { twilioWebhook } from "@/lib/twilio/webhook";
import { dialResult } from "@/lib/phone/ivr";
import { isOptionKey } from "@/lib/phone/definitions";

export const dynamic = "force-dynamic";

/** After the forward: done if they were connected, otherwise the caller is told to call again (voicemail comes later). */
export const POST = twilioWebhook(({ params, query, twiml }) => {
  const o = query.get("o");
  return isOptionKey(o) ? dialResult(twiml(), params.DialBridged === "true", o) : twiml().hangup();
});
