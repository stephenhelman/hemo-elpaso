/**
 * Google address suggestions (Places API (New), browser side). Used ONLY when the `address_autocomplete` feature toggle
 * is on (off by default) and a browser key is configured. Nothing here runs, and the Google script is never added to the
 * page, until a person focuses the address field and the caller asks for suggestions (see AddressFields).
 *
 * Key: NEXT_PUBLIC_GOOGLE_PLACES_API_KEY (a BROWSER key, restricted by HTTP referrer to HOEP's domains and by API to
 * "Maps JavaScript API" + "Places API (New)").
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Address } from "./validate";

export const GOOGLE_KEY = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY ?? "";

let loading: Promise<any> | null = null;

/** Adds the Google script (once) and resolves with the Places library. Call only after the person focused the field. */
export function loadGooglePlaces(): Promise<any> {
  if (!GOOGLE_KEY || typeof window === "undefined") return Promise.reject(new Error("no_key"));
  if (!loading) {
    loading = new Promise((resolve, reject) => {
      const w = window as any;
      const ready = () => w.google.maps.importLibrary("places").then(resolve, reject);
      if (w.google?.maps?.importLibrary) return void ready();
      const s = document.createElement("script");
      s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(GOOGLE_KEY)}&loading=async&v=weekly`;
      s.async = true;
      s.onload = ready;
      s.onerror = () => { loading = null; reject(new Error("load_failed")); };
      document.head.appendChild(s);
    });
  }
  return loading;
}

export interface Suggestion { text: string; place: any }

export async function suggest(input: string, sessionToken: unknown): Promise<Suggestion[]> {
  const places = await loadGooglePlaces();
  const { suggestions } = await places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
    input, sessionToken, includedRegionCodes: ["us"], includedPrimaryTypes: ["street_address", "premise", "subpremise"],
  });
  return (suggestions ?? []).filter((s: any) => s.placePrediction).slice(0, 5).map((s: any) => ({ text: s.placePrediction.text.toString(), place: s.placePrediction.toPlace() }));
}

export const newSessionToken = async () => new ((await loadGooglePlaces()).AutocompleteSessionToken)();

/** Chosen suggestion -> our five fields. Ends the billing session. */
export async function addressFromPlace(place: any): Promise<Address | null> {
  await place.fetchFields({ fields: ["addressComponents"] });
  const parts: { types: string[]; longText: string; shortText: string }[] = place.addressComponents ?? [];
  const get = (t: string, short = false) => { const c = parts.find((p) => p.types.includes(t)); return c ? (short ? c.shortText : c.longText) : ""; };
  const line1 = `${get("street_number")} ${get("route")}`.trim();
  const city = get("locality") || get("sublocality") || get("postal_town");
  const zip = get("postal_code");
  const state = get("administrative_area_level_1", true);
  if (!line1 || !zip) return null;
  return { line1, line2: get("subpremise") || null, city, state, zip };
}
