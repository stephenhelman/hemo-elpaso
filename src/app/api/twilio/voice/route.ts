import { twilioWebhook } from "@/lib/twilio/webhook";
import { fallbackNumber } from "@/lib/twilio/config";
import { attemptFrom, greeting, switchedOff } from "@/lib/phone/ivr";
import { phoneSystemOn } from "@/lib/phone/system";

export const dynamic = "force-dynamic";

/** Twilio, "A call comes in": the bilingual greeting and menu, or the fallback forward while the system is off. */
export const POST = twilioWebhook(async ({ query, config, twiml }) =>
  (await phoneSystemOn()) ? greeting(twiml(), attemptFrom(query.get("try"))) : switchedOff(twiml(), { to: fallbackNumber(), callerId: config.phoneNumber }),
);
