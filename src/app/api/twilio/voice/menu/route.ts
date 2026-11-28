import { twilioWebhook } from "@/lib/twilio/webhook";
import { fallbackNumber } from "@/lib/twilio/config";
import { attemptFrom, menuChoice, switchedOff } from "@/lib/phone/ivr";
import { numberToRing } from "@/lib/phone/service";
import { phoneSystemOn } from "@/lib/phone/system";

export const dynamic = "force-dynamic";

/** The caller's choice: ring whoever is on duty (they must press 1), or go to voicemail. */
export const POST = twilioWebhook(async ({ params, query, config, twiml }) =>
  (await phoneSystemOn())
    ? menuChoice(twiml(), params.Digits, attemptFrom(query.get("try")), { numberFor: (o) => numberToRing(o), callerId: config.phoneNumber })
    : switchedOff(twiml(), { to: fallbackNumber(), callerId: config.phoneNumber }),
);
