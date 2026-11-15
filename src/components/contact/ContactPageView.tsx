"use client";

import { useLanguage } from "@/context/LanguageContext";
import PageHeroBlock from "@/components/sanity/PageHeroBlock";
import { ContactInfoCard, ContactMapView } from "@/components/sanity/ContactParts";
import { pick } from "@/sanity/helpers/pick";
import type { ContactPageData } from "@/sanity/types";
import ContactForm from "./ContactForm";

/**
 * Contact page. The layout is fixed in code (hero, form + info sidebar, map);
 * Sanity supplies the hero, the form heading/subheading and the map heading, and Site
 * settings supply the sidebar. Both languages are already in `data`.
 */
export default function ContactPageView({ data }: { data: ContactPageData }) {
  const { locale } = useLanguage();
  return (
    <>
      {data.hero && <PageHeroBlock block={{ ...data.hero, _key: "hero" } as any} locale={locale} />}
      <div className="bg-neutral-50">
        <div className="container-max px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <ContactForm locale={locale} heading={pick(data.formHeading, locale)} sub={pick(data.formSubheading, locale)} />
            </div>
            <div>
              <ContactInfoCard locale={locale} />
            </div>
          </div>
        </div>
      </div>
      <ContactMapView header={data.mapHeader} locale={locale} />
    </>
  );
}
