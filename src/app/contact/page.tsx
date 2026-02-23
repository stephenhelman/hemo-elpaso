import { Metadata } from "next";
import { cookies } from "next/headers";

import ContactHero from "@/components/contact/ContactHero";
import ContactMap from "@/components/contact/ContactMap";
import { ContactBody } from "@/components/contact/ContactBody";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Get in touch with Hemophilia Outreach of El Paso. We are here to help.",
};

export default async function ContactPage() {
  const cookieStore = await cookies();
  const locale = (cookieStore.get("locale")?.value as "en" | "es") || "en";
  return (
    <>
      <ContactHero locale={locale} />
      <ContactBody locale={locale} />
      <ContactMap locale={locale} />
    </>
  );
}
