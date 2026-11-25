/**
 * Event flyers in each family's language + the household's delivery preference. PURE (no DB, no Next):
 * unit-tested in scripts/check-flyers.ts.
 */
import { isStateCode } from "@/lib/address/states";

export type Lang = "en" | "es";

// ── delivery preference ──────────────────────────────────────────────────────────────────────────────────────
export const FLYER_DELIVERIES = ["email", "mail", "none"] as const;
export type FlyerDelivery = (typeof FLYER_DELIVERIES)[number];

export const isFlyerDelivery = (v: unknown): v is FlyerDelivery => typeof v === "string" && (FLYER_DELIVERIES as readonly string[]).includes(v);

interface AddressLike { addressLine1?: string | null; addressLine2?: string | null; city?: string | null; state?: string | null; zipCode?: string | null }

/** A structured, mailable US address: street, city, a real state code and a 5-digit ZIP. A legacy one-line address is not complete. */
export function hasCompleteAddress(a: AddressLike | null | undefined): boolean {
  if (!a) return false;
  return !!a.addressLine1?.trim() && !!a.city?.trim() && isStateCode((a.state ?? "").trim().toUpperCase()) && /^\d{5}$/.test((a.zipCode ?? "").trim());
}

/** Default for a new or existing household: email if there is one, else mail if the address is complete, else none. */
export function defaultFlyerDelivery(h: { email: string | null | undefined; address: AddressLike | null | undefined }): FlyerDelivery {
  if (h.email?.trim()) return "email";
  if (hasCompleteAddress(h.address)) return "mail";
  return "none";
}

/** null = not an acceptable choice ("email" needs an email address on the household). */
export function validateFlyerDelivery(value: unknown, h: { email: string | null | undefined }): FlyerDelivery | null {
  if (!isFlyerDelivery(value)) return null;
  if (value === "email" && !h.email?.trim()) return null;
  return value;
}

// ── which flyer ──────────────────────────────────────────────────────────────────────────────────────────────
export interface EventFlyers { flyerEnUrl: string | null; flyerEsUrl: string | null; flyerEnAlt?: string | null; flyerEsAlt?: string | null }

export interface PickedFlyer {
  url: string;
  /** The language the flyer itself is in (differs from the family's when only the other one exists). */
  lang: Lang;
  isPdf: boolean;
  /** Short description, in the flyer's own language. Empty when the board did not write one. */
  alt: string;
}

/** Flyers are uploaded as-is, so decide by file extension (query string ignored). */
export const isPdfUrl = (url: string) => /\.pdf$/i.test(url.split(/[?#]/)[0]);

/** The family's language first; the other language when that is the only one; null when the event has no flyer. */
export function pickFlyer(e: EventFlyers, lang: Lang): PickedFlyer | null {
  const get = (l: Lang): PickedFlyer | null => {
    const url = (l === "en" ? e.flyerEnUrl : e.flyerEsUrl)?.trim();
    if (!url) return null;
    return { url, lang: l, isPdf: isPdfUrl(url), alt: ((l === "en" ? e.flyerEnAlt : e.flyerEsAlt) ?? "").trim() };
  };
  return get(lang) ?? get(lang === "en" ? "es" : "en");
}

export const householdLang = (preferredLanguage: string | null | undefined): Lang => (preferredLanguage === "es" ? "es" : "en");

// ── invitation email ─────────────────────────────────────────────────────────────────────────────────────────
export interface InvitationFlyer {
  /** email preference + an IMAGE flyer: shown inline from its public URL. A PDF is never inlined. */
  imageUrl: string | null;
  imageAlt: string;
  /** email preference: "Download the flyer" link (image or PDF). */
  downloadUrl: string | null;
  /** mail preference: "We'll mail you the flyer". */
  mailNote: boolean;
}

/**
 * What the invitation carries for ONE household. `email`: inline image (images only) + download link. `mail`: only the
 * "we'll mail you the flyer" line. `none`: nothing. An event without a flyer carries nothing for anybody.
 * No attachments, ever. `titleFallback` is the alt text when the board wrote none.
 */
export function invitationFlyer(e: EventFlyers, delivery: string | null | undefined, lang: Lang, titleFallback: string): InvitationFlyer | null {
  const f = pickFlyer(e, lang);
  if (!f) return null;
  if (delivery === "email") {
    return { imageUrl: f.isPdf ? null : f.url, imageAlt: f.alt || titleFallback, downloadUrl: f.url, mailNote: false };
  }
  if (delivery === "mail") return { imageUrl: null, imageAlt: "", downloadUrl: null, mailNote: true };
  return null;
}

// ── upload validation ────────────────────────────────────────────────────────────────────────────────────────
export const FLYER_MAX_BYTES = 10 * 1024 * 1024;
export const FLYER_MIME = ["image/png", "image/jpeg", "application/pdf"] as const;
export const FLYER_ALT_MAX = 300;
export const cleanAlt = (v: unknown): string | null => {
  if (typeof v !== "string") return null;
  const t = v.replace(/\s+/g, " ").trim().slice(0, FLYER_ALT_MAX);
  return t || null;
};
