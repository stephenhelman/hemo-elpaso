import { initAuth0 } from "@auth0/nextjs-auth0";
import { SESSION_CONFIG } from "@/lib/auth0-config";

/** The one Node-side Auth0 instance (secret, issuer, client id and base URL still come from the AUTH0_* env vars). */
export const { getSession, handleAuth, handleLogin } = initAuth0({ session: SESSION_CONFIG });
