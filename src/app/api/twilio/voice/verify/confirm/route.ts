import { twilioWebhook } from "@/lib/twilio/webhook";
import { verifyAnswer } from "@/lib/phone/ivr";
import { confirmVerification } from "@/lib/phone/service";

export const dynamic = "force-dynamic";

/** The digits typed on the called phone. */
export const POST = twilioWebhook(async ({ params, query, twiml }) => {
  const id = query.get("n") ?? "";
  return verifyAnswer(twiml(), id, await confirmVerification(id, params.Digits ?? ""));
});
