import { Resend } from "resend";

// Do not throw at import time: a missing key used to turn every route that
// imports this into a 500. sendLoggedEmail() checks RESEND_API_KEY itself and
// records a "missing_resend_api_key" failure instead.
export const resend = new Resend(process.env.RESEND_API_KEY || "re_missing_key");
export const EMAIL_FROM =
  process.env.EMAIL_FROM || "HOEP Events <onboarding@resend.dev>";
