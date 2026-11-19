import { getContactPage } from "@/sanity/data";
import ContactPageView from "@/components/contact/ContactPageView";

/**
 * Hero, form heading and map heading come from Sanity (contactPage); the sidebar comes from
 * Site settings. The dictionary copy is the fallback. The old components in components/contact/*
 * (ContactHero, ContactBody, ContactInfo, ContactMap) are kept as reference.
 */
export const dynamic = "force-dynamic"; // TURNSTILE_SITE_KEY is read at request time

export default async function ContactPage() {
  const data = await getContactPage();
  // Public site key, read at request time and handed to the client form.
  const turnstileSiteKey = process.env.TURNSTILE_SITE_KEY ?? null;
  return <ContactPageView data={data} turnstileSiteKey={turnstileSiteKey} />;
}
