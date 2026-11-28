/** What the Phone settings page is given. Numbers leave the server MASKED, and codes never. */
import { maskNumber, resolveTwilioMode, type TwilioMode } from "@/lib/twilio/mode";
import { hoepNumber, twilioConfig } from "@/lib/twilio/config";
import { OPTION_KEYS, OPTIONS, destinationFor, type Hours, type OptionKey } from "./definitions";
import { boardPeople, readRouting } from "./store";
import { callerDataReady } from "./caller";

export interface PhoneView {
  mode: TwilioMode;
  configured: boolean;
  /** Callers can leave a message (PHONE_DATA_KEY is set). */
  voicemailReady: boolean;
  numbers: { id: string; owner: string; masked: string; verified: boolean; onBoard: boolean }[];
  options: { key: OptionKey; label: { en: string; es: string }; numberId: string | null; hours: Hours; ringsNow: boolean }[];
  /** Only for admin@, to add a number. */
  people: { id: string; name: string }[];
}

export async function phoneView(canManage: boolean, now = new Date()): Promise<PhoneView> {
  const [routing, people] = await Promise.all([readRouting(), boardPeople()]);
  const boardIds = new Set(people.map((p) => p.id));
  let configured = true;
  try { twilioConfig(); } catch { configured = false; }
  return {
    mode: resolveTwilioMode(process.env),
    configured,
    voicemailReady: callerDataReady(),
    numbers: routing.numbers.map((n) => ({
      id: n.id, owner: people.find((p) => p.id === n.ownerId)?.name ?? "—", masked: maskNumber(n.number), verified: !!n.verifiedAt, onBoard: boardIds.has(n.ownerId),
    })),
    options: OPTION_KEYS.map((key) => ({
      key, label: OPTIONS[key].label, numberId: routing.options[key].numberId, hours: routing.options[key].hours,
      ringsNow: destinationFor(routing, key, boardIds, now, hoepNumber()).ring,
    })),
    people: canManage ? people : [],
  };
}
