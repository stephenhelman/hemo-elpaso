/**
 * Changing a route: validate, save + audit, drop the cache, tell every officer. PURE logic with injected side
 * effects so the rules are testable without a database (see scripts/check-email-routing.ts).
 */
import { ROUTE_DEFS, officerAddresses, resolveRecipients, sameRecipients, validateRecipients, TEST_LIMIT_PER_MINUTE, type RouteKey, type ValidationError } from "./definitions";

export interface Actor { id: string; name: string }

export interface ChangeRecord {
  route: RouteKey;
  oldValue: string[];
  newValue: string[];
  actor: Actor;
  details: string;
}

export interface ChangeDeps {
  domain: string;
  /** Raw stored recipients for the route, or null when there is no row. */
  readStored: (key: RouteKey) => Promise<string[] | null>;
  /** Upsert the row AND write the audit entry in one transaction. */
  persist: (rec: ChangeRecord) => Promise<void>;
  invalidate: () => void;
  /** Email all officers. Resolves true when the send was accepted. */
  notifyOfficers: (to: string[], rec: ChangeRecord) => Promise<boolean>;
}

export type ChangeResult =
  | { ok: true; changed: false; value: string[] }
  | { ok: true; changed: true; value: string[]; noticeSent: boolean }
  | { ok: false; error: ValidationError; address?: string };

export async function changeRoute(deps: ChangeDeps, key: RouteKey, input: unknown, actor: Actor): Promise<ChangeResult> {
  const v = validateRecipients(key, input, deps.domain);
  if (!v.ok) return v;

  const oldValue = resolveRecipients(key, await deps.readStored(key), deps.domain);
  if (sameRecipients(oldValue, v.value)) return { ok: true, changed: false, value: oldValue };

  const policy = ROUTE_DEFS[key].publishedInPolicy;
  const rec: ChangeRecord = {
    route: key,
    oldValue,
    newValue: v.value,
    actor,
    details: `${policy ? "PRIVACY POLICY CONTACT CHANGED. " : ""}Email route ${key} changed from ${oldValue.join(", ")} to ${v.value.join(", ")} by ${actor.name}`,
  };
  await deps.persist(rec);
  deps.invalidate();

  let noticeSent = false;
  try {
    noticeSent = await deps.notifyOfficers(officerAddresses(deps.domain), rec);
  } catch {
    noticeSent = false;
  }
  return { ok: true, changed: true, value: v.value, noticeSent };
}

/** Test sends: at most TEST_LIMIT_PER_MINUTE per user per minute. `recentCount` = attempts in the last 60 s. */
export const testRateLimited = (recentCount: number) => recentCount >= TEST_LIMIT_PER_MINUTE;

/**
 * A test email goes ONLY to the route's currently configured recipients. Nothing the client sends can add or
 * change an address: the caller passes just the route key.
 */
export async function testRecipients(deps: Pick<ChangeDeps, "domain" | "readStored">, key: RouteKey): Promise<string[]> {
  return resolveRecipients(key, await deps.readStored(key), deps.domain);
}

export function noticeText(rec: ChangeRecord) {
  const policy = ROUTE_DEFS[rec.route].publishedInPolicy;
  const label = ROUTE_DEFS[rec.route].label;
  return {
    subjectEn: `Email routing changed: ${label.en}`,
    subjectEs: `Cambio en el enrutamiento de correo: ${label.es}`,
    lineEn: `Email routing for ${rec.route} (${label.en}) changed from ${rec.oldValue.join(", ")} to ${rec.newValue.join(", ")} by ${rec.actor.name}.`,
    lineEs: `El enrutamiento de correo de ${rec.route} (${label.es}) cambió de ${rec.oldValue.join(", ")} a ${rec.newValue.join(", ")} por ${rec.actor.name}.`,
    policyEn: policy ? "This address is printed in the published Privacy Policy, so the policy’s contact has changed." : "",
    policyEs: policy ? "Esta dirección se publica en la Política de privacidad, por lo que cambió el contacto de la política." : "",
  };
}
