"use client";

import { Phone, Mail, MapPin, Facebook, ExternalLink } from "lucide-react";
import HoepCard from "@/components/ui/HoepCard";
import { useSiteInfo } from "@/context/SiteSettingsContext";
import { contactEmail } from "@/lib/site";
import type { Lang } from "@/types";
import { pick } from "@/sanity/helpers/pick";
import type { SectionHeaderData } from "@/sanity/types";
import { contactInfoTranslation, contactMapTranslation } from "@/translation/contactPage";
import { HeadingText } from "./RichText";

/** Sidebar: everything comes from Site settings (phone, Facebook, location, note); the info email is from lib/site.ts. */
export function ContactInfoCard({ locale }: { locale: Lang }) {
  const t = contactInfoTranslation[locale]; // labels are UI text and stay in code
  const site = useSiteInfo();
  const location = pick(site.locationLabel, locale);
  const note = pick(site.contactNote, locale);
  const fb = pick(site.facebookLabel, locale);

  return (
    <div className="space-y-4">
      <HoepCard>
        <h2 className="font-display font-bold text-neutral-900 mb-5">{t.heading}</h2>
        <div className="space-y-5">
          <InfoRow icon={<Phone className="w-4 h-4" />} label={t.phone} value={site.phone.display} href={`tel:${site.phone.e164}`} />
          <InfoRow icon={<Mail className="w-4 h-4" />} label={t.email} value={contactEmail()} href={`mailto:${contactEmail()}`} />
          {location && <InfoRow icon={<MapPin className="w-4 h-4" />} label={t.address} value={location} />}
        </div>
      </HoepCard>

      <HoepCard>
        <h3 className="font-display font-bold text-neutral-900 mb-4 text-sm">{t.social}</h3>
        <a
          href={site.facebookUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 p-3 rounded-xl hover:bg-neutral-50 transition-colors group"
        >
          <div className="w-9 h-9 rounded-full bg-[#1877F2]/10 flex items-center justify-center flex-shrink-0">
            <Facebook className="w-4 h-4 text-[#1877F2]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-neutral-900 group-hover:text-primary transition-colors">{fb}</p>
          </div>
        </a>
      </HoepCard>

      {note && <p className="text-xs text-neutral-400 text-center px-2">{note}</p>}
    </div>
  );
}

function InfoRow({ icon, label, value, href }: { icon: React.ReactNode; label: string; value: string; href?: string }) {
  return (
    <div className="flex gap-3">
      <span className="text-primary-500 flex-shrink-0 mt-0.5">{icon}</span>
      <div>
        <p className="text-xs text-neutral-400 font-medium uppercase tracking-wide mb-0.5">{label}</p>
        {href ? (
          <a href={href} className="text-sm text-neutral-700 hover:text-primary transition-colors font-medium">
            {value}
          </a>
        ) : (
          <p className="text-sm text-neutral-700">{value}</p>
        )}
      </div>
    </div>
  );
}

/** Map band. Heading/subheading are editable; the embed, the overlay card layout and "Get Directions" stay in code. */
export function ContactMapView({ header, locale }: { header?: SectionHeaderData; locale: Lang }) {
  const t = contactMapTranslation[locale];
  const site = useSiteInfo();
  const sub = pick(header?.subheading, locale);
  const location = pick(site.locationLabel, locale);

  return (
    <div className="bg-white border-t border-neutral-100">
      <div className="container-max px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-8">
          {header?.heading && (
            <h2 className="font-display text-2xl font-bold text-neutral-900 mb-2">
              <HeadingText field={header.heading} locale={locale} />
            </h2>
          )}
          {sub && <p className="text-neutral-500">{sub}</p>}
        </div>

        <div className="relative rounded-2xl overflow-hidden border border-neutral-200 shadow-sm">
          <iframe
            src={MAP_EMBED_SRC}
            width="100%"
            height="400"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title={t.mapTitle}
          />
          <div className="absolute bottom-4 left-4">
            <div className="bg-white rounded-xl shadow-lg p-4 flex items-start gap-3 max-w-xs">
              <div className="w-9 h-9 rounded-full bg-primary-50 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="font-display font-bold text-neutral-900 text-sm">{site.orgName}</p>
                {location && <p className="text-xs text-neutral-500">{location}</p>}
                <a
                  href="https://maps.google.com/?q=El+Paso+Texas"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary font-medium mt-1 hover:underline"
                >
                  {t.directions}
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Fixed in code (not editable in the Studio).
const MAP_EMBED_SRC =
  "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d215697.32506281038!2d-106.56989!3d31.7618778!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x86e75d90a0588239%3A0x4c0b18d0e4f02609!2sEl%20Paso%2C%20TX!5e0!3m2!1sen!2sus!4v1698000000000!5m2!1sen!2sus";
