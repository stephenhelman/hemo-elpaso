/**
 * Runs once when the server starts. Refuses to start with a bad EMAIL_MODE (live outside production, or an unknown value),
 * so a stray environment variable can't turn dev or a preview deploy into live sending (lib/email/mode.ts).
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { resolveEmailMode } = await import("@/lib/email/mode");
    const mode = resolveEmailMode(process.env);
    console.log(`[email] EMAIL_MODE=${mode}`);
  }
}
