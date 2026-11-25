import { isFeatureEnabled } from "@/lib/features";

/**
 * Whether address forms offer Google suggestions: the `address_autocomplete` toggle is on AND a browser key exists.
 * Decided on the server and handed to the form as a prop. Off by default; when false, no Google script is ever added.
 */
export async function addressAutocompleteEnabled(): Promise<boolean> {
  return (await isFeatureEnabled("address_autocomplete")) && !!process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;
}
