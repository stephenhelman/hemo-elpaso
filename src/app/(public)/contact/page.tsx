import { getContactPage } from "@/sanity/data";
import ContactPageView from "@/components/contact/ContactPageView";

/**
 * Hero, form heading and map heading come from Sanity (contactPage); the sidebar comes from
 * Site settings. The dictionary copy is the fallback. The old components in components/contact/*
 * (ContactHero, ContactBody, ContactInfo, ContactMap) are kept as reference.
 */
export default async function ContactPage() {
  const data = await getContactPage();
  return <ContactPageView data={data} />;
}
