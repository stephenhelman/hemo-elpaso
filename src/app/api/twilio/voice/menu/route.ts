import { twilioWebhook } from "@/lib/twilio/webhook";
import { attemptFrom, menuChoice } from "@/lib/phone/ivr";
import { numberToRing } from "@/lib/phone/service";

export const dynamic = "force-dynamic";

/** The caller's choice: ring whoever is on duty (they must press 1), or say nobody could be reached. */
export const POST = twilioWebhook(({ params, query, config, twiml }) =>
  menuChoice(twiml(), params.Digits, attemptFrom(query.get("try")), { numberFor: (o) => numberToRing(o), callerId: config.phoneNumber }),
);
