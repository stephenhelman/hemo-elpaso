import { twilioWebhook } from "@/lib/twilio/webhook";
import { verifyPrompt } from "@/lib/phone/ivr";
import { verificationWaiting } from "@/lib/phone/service";

export const dynamic = "force-dynamic";

/** The call that confirms a duty number: asks for the code shown to the admin. */
export const POST = twilioWebhook(async ({ query, twiml }) => {
  const id = query.get("n") ?? "";
  return verifyPrompt(twiml(), id, await verificationWaiting(id));
});
