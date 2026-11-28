/**
 * Runs once when the server starts. Refuses to start with a bad EMAIL_MODE or TWILIO_MODE (live outside production, or
 * an unknown value), so a stray environment variable can't turn dev or a preview deploy into live sending or calling
 * (lib/email/mode.ts, lib/twilio/mode.ts). Twilio CREDENTIALS are deliberately not checked here: without them only the
 * phone routes fail. Likewise R2 storage (lib/r2-config.ts): a missing or refused setting is logged here, and only the
 * routes that use storage fail. This function must not throw for it, or every page would.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { resolveEmailMode } = await import("@/lib/email/mode");
    const mode = resolveEmailMode(process.env);
    console.log(`[email] EMAIL_MODE=${mode}`);
    const { resolveTwilioMode } = await import("@/lib/twilio/mode");
    console.log(`[twilio] TWILIO_MODE=${resolveTwilioMode(process.env)}`);
    const { readR2Config } = await import("@/lib/r2-config");
    try {
      readR2Config();
      console.log("[r2] storage settings present");
    } catch (e) {
      console.error(`[r2] file storage is unavailable, so photo and flyer actions will answer 503: ${(e as Error).message}`);
    }
  }
}
