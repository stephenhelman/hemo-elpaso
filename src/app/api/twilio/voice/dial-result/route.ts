import { twilioWebhook } from "@/lib/twilio/webhook";
import { closed, dialConnected, dialResult } from "@/lib/phone/ivr";
import { isOptionKey } from "@/lib/phone/definitions";
import { phoneSystemOn } from "@/lib/phone/system";

export const dynamic = "force-dynamic";

/** After the forward: done if they were connected (DialBridged), otherwise voicemail, or a notice while the system is off. */
export const POST = twilioWebhook(async ({ params, query, twiml }) => {
  const o = query.get("o");
  if (!isOptionKey(o)) return twiml().hangup();
  if (!dialConnected(params) && !(await phoneSystemOn())) return closed(twiml());
  return dialResult(twiml(), params, o);
});
