import Link from "next/link";
import Image from "next/image";
import { Facebook, Mail, Phone, Heart } from "lucide-react";
import { footerTranslation } from "@/translation/layoutPage";

interface FooterProps {
  lang: "en" | "es";
}

export default function Footer({ lang }: FooterProps) {
  const t = footerTranslation[lang];

  return (
    <footer className="bg-neutral-900 text-neutral-300">
      {/* Main Footer */}
      <div className="container-max section-padding">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <Image
                src="/logo.png"
                alt="Hemophilia Outreach of El Paso"
                width={40}
                height={40}
                className="rounded-full object-contain"
              />
              <div>
                <p className="font-display font-bold text-white text-sm leading-tight">
                  Hemophilia Outreach
                </p>
                <p className="font-display font-bold text-primary-400 text-sm leading-tight">
                  of El Paso
                </p>
              </div>
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
                  href="tel:9156218291"
                  className="hover:text-primary-400 transition-colors"
                >
                  (915) 621-8291
                </a>
              </li>
              <li className="flex items-center gap-2 text-sm text-neutral-400">
                <Mail className="w-4 h-4 text-primary-400 flex-shrink-0" />
                <a
                  href="mailto:info@hemo-el-paso.org"
                  className="hover:text-primary-400 transition-colors"
                >
                  info@hemo-el-paso.org
                </a>
              </li>
            </ul>

            <h3 className="font-display font-semibold text-white text-sm uppercase tracking-wider mt-6 mb-4">
              {t.connect}
            </h3>
            <a
              href="https://www.facebook.com/4HOEP"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-neutral-400 hover:text-primary-400 transition-colors"
            >
              <Facebook className="w-4 h-4" />
              <span>Facebook</span>
            </a>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="font-display font-semibold text-white text-sm uppercase tracking-wider mb-4">
              {t.newsletter}
            </h3>
            <p className="text-sm text-neutral-400 mb-4">{t.newsletterSub}</p>
            <form className="flex flex-col gap-2">
              <input
                type="email"
                placeholder={t.emailPlaceholder}
                className="px-4 py-2.5 rounded-lg bg-neutral-800 border border-neutral-700 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-primary-500 transition-colors"
              />
              <button
                type="submit"
                className="px-4 py-2.5 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-600 transition-colors duration-200"
              >
                {t.subscribe}
              </button>
            </form>
          </div>
        </div>
      </div>
      ß{/* Bottom Bar */}
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
