import { twilioWebhook } from "@/lib/twilio/webhook";
import { attemptFrom, greeting } from "@/lib/phone/ivr";

export const dynamic = "force-dynamic";

/** Twilio, "A call comes in": the bilingual greeting and menu. */
export const POST = twilioWebhook(({ query, twiml }) => greeting(twiml(), attemptFrom(query.get("try"))));
