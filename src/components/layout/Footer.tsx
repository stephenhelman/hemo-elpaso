import { contactEmail, SITE_PHONE, FACEBOOK_URL, FACEBOOK_LABEL } from "@/lib/site";
import Link from "next/link";
import BrandMark from "@/components/brand/BrandMark";
import { Facebook, Mail, Phone, Heart } from "lucide-react";
import { footerTranslation } from "@/translation/layoutPage";
import { useLanguage } from "@/context/LanguageContext";
import { useSiteFlags } from "@/context/SiteFlagsContext";
import { useSiteInfo } from "@/context/SiteSettingsContext";
import SponsorLogo from "@/components/sanity/SponsorLogo";

export default function Footer() {
  const { locale } = useLanguage();
  const { registrationOpen } = useSiteFlags();
  const t = footerTranslation[locale];
  const sponsors = (useSiteInfo().footerSponsors ?? []).slice(0, 4);

  return (
    <footer className="bg-neutral-900 text-neutral-300">
      {/* Main Footer */}
      <div className="container-max section-padding">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="mb-4">
              {/* Dark band: reversed (white) icon. The name is written beside it, so the icon is decorative (alt=""). */}
              <BrandMark tone="dark" iconHeight={48} iconAlt="" />
            </div>
            <p className="text-sm text-neutral-400 leading-relaxed">
              {t.tagline}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-display font-semibold text-white text-sm uppercase tracking-wider mb-4">
              {t.quickLinks}
            </h3>
            <ul className="space-y-2">
              {t.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-neutral-400 hover:text-primary-400 transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-display font-semibold text-white text-sm uppercase tracking-wider mb-4">
              {t.contact}
            </h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-sm text-neutral-400">
                <Phone className="w-4 h-4 text-primary-400 flex-shrink-0" />
                <a
                  href={SITE_PHONE.tel}
                  className="hover:text-primary-400 transition-colors"
                >
                  {SITE_PHONE.display}
                </a>
              </li>
              <li className="flex items-center gap-2 text-sm text-neutral-400">
                <Mail className="w-4 h-4 text-primary-400 flex-shrink-0" />
                <a
                  href={`mailto:${contactEmail()}`}
                  className="hover:text-primary-400 transition-colors"
                >
                  {contactEmail()}
                </a>
              </li>
            </ul>

            <h3 className="font-display font-semibold text-white text-sm uppercase tracking-wider mt-6 mb-4">
              {t.connect}
            </h3>
            <a
              href={FACEBOOK_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-neutral-400 hover:text-primary-400 transition-colors"
            >
              <Facebook className="w-4 h-4" />
              <span>{FACEBOOK_LABEL[locale]}</span>
            </a>
          </div>

          {registrationOpen && (
          <div>
            <h3 className="font-display font-semibold text-white text-sm uppercase tracking-wider mb-4">
              {t.newsletter}
            </h3>
            <p className="text-sm text-neutral-400 mb-4">{t.newsletterSub}</p>
            <Link
              href="/register-info"
              className="inline-flex px-4 py-2.5 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-600 transition-colors duration-200"
            >
              {t.subscribe}
            </Link>
          </div>
          )}
        </div>
      </div>

      {/* Sponsors (optional; hidden when none are chosen in Site settings) */}
      {sponsors.length > 0 && (
        <div className="border-t border-neutral-800">
          <div className="container-max px-4 sm:px-6 lg:px-8 py-8 text-center">
            <h3 className="font-display font-semibold text-white text-sm uppercase tracking-wider mb-5">
              {locale === "es" ? "Gracias a nuestros patrocinadores" : "Thank you to our sponsors"}
            </h3>
            <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-4">
              {sponsors.map((s) => (
                <li key={s._id}>
                  <SponsorLogo sponsor={s} locale={locale} height={36} width={160} />
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Bottom Bar */}
      <div className="border-t border-neutral-800">
        <div className="container-max px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-neutral-500">
            © {new Date().getFullYear()} Hemophilia Outreach of El Paso.{" "}
            {t.rights}
          </p>

          <p className="text-xs text-neutral-500 flex items-center gap-1">
            {t.madeWith}{" "}
            <Heart className="w-3 h-3 text-primary-500 fill-primary-500" />{" "}
            {t.forCommunity}
          </p>
        </div>
      </div>
    </footer>
  );
}
