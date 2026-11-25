/**
 * Address form draft + its empty value. Lives here (no "use client") so SERVER components can call emptyAddress():
 * a function exported from a "use client" module is only a client reference on the server and throws when called.
 */
import { DEFAULT_STATE } from "./states";

export interface AddressDraft { line1: string; line2: string; city: string; state: string; zip: string }
export const emptyAddress = (): AddressDraft => ({ line1: "", line2: "", city: "", state: DEFAULT_STATE, zip: "" });
