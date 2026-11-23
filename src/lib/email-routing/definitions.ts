/**
 * Email routes the board can set (Admin > Settings > Email routing). PURE: no DB, no Next, no env, so it is
 * unit-testable. The mail domain is always passed in (callers use emailDomain() from lib/site.ts).
 *
 * Two kinds of route:
 *   notifications  where an incoming message goes (contact-form reasons, the privacy contact). Recipients are
 *                  role/group addresses on the mail domain; free-typed addresses are allowed ONLY on that domain,
 *                  so a family's message can never be routed to a personal inbox.
 *   replies        which mailbox replies to our automated mail go to. One address, chosen from a fixed list.
 *
 * What is deliberately NOT a route: the "from" addresses (noreply@, info@, events@). They must be on the
 * Resend-verified domain, and a wrong one makes every send fail.
 */
export const ROUTE_KEYS = [
  "contact.general",
  "contact.family",
  "contact.volunteer",
  "contact.sponsor",
  "contact.media",
  "contact.other",
  "privacy",
  "reply.info",
  "reply.events",
] as const;
export type RouteKey = (typeof ROUTE_KEYS)[number];

export const isRouteKey = (k: unknown): k is RouteKey => typeof k === "string" && (ROUTE_KEYS as readonly string[]).includes(k);

/** Role / group mailboxes on the mail domain (local parts). Officer turnover never needs a settings change. */
export const ROLE_LOCALS = ["president", "vicepresident", "secretary", "treasurer", "info", "events", "privacy", "admin"] as const;

/** Receive the notice whenever a route changes. */
export const OFFICER_LOCALS = ["president", "vicepresident", "secretary", "treasurer"] as const;

export interface RouteDef {
  key: RouteKey;
  group: "notifications" | "replies";
  /** "list": one or more recipients. "single": exactly one address chosen from `options`. */
  mode: "list" | "single";
  /** Local parts offered in the picker (all of ROLE_LOCALS for lists). */
  options: readonly string[];
  /** Free-typed addresses on the mail domain (lists only). */
  allowTyped: boolean;
  defaultLocals: readonly string[];
  /** The address is printed in the published privacy policy. */
  publishedInPolicy?: boolean;
  label: { en: string; es: string };
  help: { en: string; es: string };
}

const REPLY_OPTIONS = ["info", "events", "president", "vicepresident", "secretary", "treasurer"] as const;

export const ROUTE_DEFS: Record<RouteKey, RouteDef> = {
  "contact.general": {
    key: "contact.general", group: "notifications", mode: "list", options: ROLE_LOCALS, allowTyped: true, defaultLocals: ["info"],
    label: { en: "Contact form: General inquiry", es: "Formulario de contacto: Consulta general" },
    help: { en: "Messages sent with the reason “General Inquiry”.", es: "Mensajes con el motivo “Consulta general”." },
  },
  "contact.family": {
    key: "contact.family", group: "notifications", mode: "list", options: ROLE_LOCALS, allowTyped: true, defaultLocals: ["secretary"],
    label: { en: "Contact form: Family / Patient support", es: "Formulario de contacto: Apoyo familiar / paciente" },
    help: { en: "Messages from families asking for support.", es: "Mensajes de familias que piden apoyo." },
  },
  "contact.volunteer": {
    key: "contact.volunteer", group: "notifications", mode: "list", options: ROLE_LOCALS, allowTyped: true, defaultLocals: ["secretary"],
    label: { en: "Contact form: Volunteering", es: "Formulario de contacto: Voluntariado" },
    help: { en: "Messages from people who want to volunteer.", es: "Mensajes de personas que quieren ser voluntarias." },
  },
  "contact.sponsor": {
    key: "contact.sponsor", group: "notifications", mode: "list", options: ROLE_LOCALS, allowTyped: true, defaultLocals: ["treasurer"],
    label: { en: "Contact form: Sponsorship", es: "Formulario de contacto: Patrocinio" },
    help: { en: "Messages from prospective sponsors.", es: "Mensajes de posibles patrocinadores." },
  },
  "contact.media": {
    key: "contact.media", group: "notifications", mode: "list", options: ROLE_LOCALS, allowTyped: true, defaultLocals: ["president"],
    label: { en: "Contact form: Media / Press", es: "Formulario de contacto: Medios / Prensa" },
    help: { en: "Messages from reporters and media.", es: "Mensajes de periodistas y medios." },
  },
  "contact.other": {
    key: "contact.other", group: "notifications", mode: "list", options: ROLE_LOCALS, allowTyped: true, defaultLocals: ["info"],
    label: { en: "Contact form: Other (and any unknown reason)", es: "Formulario de contacto: Otro (y cualquier motivo desconocido)" },
    help: { en: "Everything that does not match another reason.", es: "Todo lo que no corresponde a otro motivo." },
  },
  privacy: {
    key: "privacy", group: "notifications", mode: "single", options: ["privacy", "info", "president", "vicepresident", "secretary", "treasurer"], allowTyped: false,
    defaultLocals: ["privacy"], publishedInPolicy: true,
    label: { en: "Privacy contact", es: "Contacto de privacidad" },
    help: { en: "The address families use for privacy requests. It is printed in the Privacy Policy, Terms and Children’s policy.", es: "La dirección que las familias usan para solicitudes de privacidad. Se publica en la Política de privacidad, los Términos y la política de menores." },
  },
  "reply.info": {
    key: "reply.info", group: "replies", mode: "single", options: REPLY_OPTIONS, allowTyped: false, defaultLocals: ["info"],
    label: { en: "Replies to registration and contact auto-reply emails", es: "Respuestas a los correos de registro y de acuse de contacto" },
    help: { en: "Where a reply goes when someone answers the registration confirmation, household confirmation or contact auto-reply.", es: "A dónde llega la respuesta cuando alguien contesta la confirmación de registro, la de hogar o el acuse de contacto." },
  },
  "reply.events": {
    key: "reply.events", group: "replies", mode: "single", options: REPLY_OPTIONS, allowTyped: false, defaultLocals: ["events"],
    label: { en: "Replies to event emails", es: "Respuestas a los correos de eventos" },
    help: { en: "Where a reply goes when someone answers an invitation, RSVP confirmation, reminder or cancellation.", es: "A dónde llega la respuesta cuando alguien contesta una invitación, confirmación de RSVP, recordatorio o cancelación." },
  },
};

export const addr = (local: string, domain: string) => `${local}@${domain}`;

export const defaultRecipients = (key: RouteKey, domain: string): string[] =>
  ROUTE_DEFS[key].defaultLocals.map((l) => addr(l, domain));

export const officerAddresses = (domain: string): string[] => OFFICER_LOCALS.map((l) => addr(l, domain));

/** Contact-form reason → route. Unknown reasons use contact.other. */
export function routeForContactReason(reason: string): RouteKey {
  const k = `contact.${reason}`;
  return isRouteKey(k) ? k : "contact.other";
}

export type ValidationError = "not_a_list" | "empty" | "too_many" | "invalid_address" | "external_domain" | "not_allowed" | "needs_one";
export type Validation = { ok: true; value: string[] } | { ok: false; error: ValidationError; address?: string };

const LOCAL_RE = /^[a-z0-9][a-z0-9._+-]{0,63}$/;
export const MAX_RECIPIENTS = 8;

/** Normalizes (trim, lower-case, de-duplicate) and validates a route's recipients against the mail domain. */
export function validateRecipients(key: RouteKey, input: unknown, domain: string): Validation {
  const def = ROUTE_DEFS[key];
  if (!Array.isArray(input) || input.some((v) => typeof v !== "string")) return { ok: false, error: "not_a_list" };
  const list = Array.from(new Set((input as string[]).map((s) => s.trim().toLowerCase()).filter(Boolean)));
  if (list.length === 0) return { ok: false, error: "empty" };
  if (list.length > MAX_RECIPIENTS) return { ok: false, error: "too_many" };
  if (def.mode === "single" && list.length !== 1) return { ok: false, error: "needs_one" };

  const d = domain.toLowerCase();
  for (const a of list) {
    const at = a.split("@");
    if (at.length !== 2 || !LOCAL_RE.test(at[0])) return { ok: false, error: "invalid_address", address: a };
    if (at[1] !== d) return { ok: false, error: "external_domain", address: a };
    const permitted = def.options.includes(at[0]) || (def.allowTyped && def.mode === "list");
    if (!permitted) return { ok: false, error: "not_allowed", address: a };
  }
  return { ok: true, value: list };
}

/**
 * The effective recipients: the stored value if it is still valid for the current mail domain, otherwise the
 * code default. Re-validating on read means a bad or stale row (or a domain change) can never route mail outside
 * the domain, and mail never stops.
 */
export function resolveRecipients(key: RouteKey, stored: string[] | null | undefined, domain: string): string[] {
  if (stored) {
    const v = validateRecipients(key, stored, domain);
    if (v.ok) return v.value;
  }
  return defaultRecipients(key, domain);
}

export const sameRecipients = (a: string[], b: string[]) => a.length === b.length && a.every((x, i) => x === b[i]);

export const TEST_LIMIT_PER_MINUTE = 5;
