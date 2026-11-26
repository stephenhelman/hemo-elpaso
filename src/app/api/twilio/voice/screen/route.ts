import { twilioWebhook } from "@/lib/twilio/webhook";
import { screen } from "@/lib/phone/ivr";
import { isOptionKey } from "@/lib/phone/definitions";

export const dynamic = "force-dynamic";

/** Runs on the answering phone, before the callers are connected: press 1 to accept. */
export const POST = twilioWebhook(({ query, twiml }) => {
  const o = query.get("o");
  return isOptionKey(o) ? screen(twiml(), o) : twiml().hangup();
});
