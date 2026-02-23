import Section from "@/components/layout/Section";
import { Heart } from "lucide-react";
import { founderStoryTranslation } from "@/translation/aboutPage";
import { useLanguage } from "@/context/LanguageContext";

export default function FounderStory() {
  const { locale } = useLanguage();
  const t = founderStoryTranslation[locale];

  return (
    <Section background="white">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        {/* Text */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-0.5 bg-primary-400" />
            <span className="text-primary-500 text-sm font-semibold tracking-widest uppercase">
              {t.eyebrow}
            </span>
          </div>

          <h2 className="font-display text-3xl sm:text-4xl font-bold text-neutral-900 leading-[1.2] mb-6">
            {t.heading}
          </h2>

          <div className="space-y-4">
            {t.paragraphs.map((p, i) => (
              <p key={i} className="text-neutral-600 leading-relaxed">
                {p}
              </p>
            ))}
          </div>

          {/* Founder credit */}
          <div className="flex items-center gap-3 mt-8 pt-8 border-t border-neutral-100">
            <div className="w-12 h-12 rounded-full bg-primary-50 border-2 border-primary-200 flex items-center justify-center flex-shrink-0">
              <Heart className="w-5 h-5 text-primary fill-primary" />
            </div>
            <div>
              <p className="font-display font-bold text-neutral-900">
                {t.founder}
              </p>
              <p className="text-sm text-neutral-500">{t.founderTitle}</p>
            </div>
          </div>
        </div>

        {/* Hall of Fame + Stats */}
        <div className="space-y-6">
          {/* 1993 card */}
          <div className="bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl p-8 text-white">
            <p className="font-display text-7xl font-bold opacity-20 leading-none mb-2">
              1993
            </p>
            <p className="font-display text-2xl font-bold mb-2">
              {locale === "en" ? "Year Founded" : "Año de Fundación"}
            </p>
            <p className="text-primary-100 text-sm">
              {locale === "en"
                ? "Over 30 years serving the El Paso bleeding disorders community"
                : "Más de 30 años sirviendo a la comunidad de trastornos hemorrágicos de El Paso"}
            </p>
          </div>

          {/* Hall of Fame */}
          <div className="bg-neutral-50 rounded-2xl p-6 border border-neutral-200">
            <h3 className="font-display font-bold text-neutral-900 mb-4 flex items-center gap-2">
              <span className="text-lg">🏛️</span>
              {t.hallOfFame}
            </h3>
            <ul className="space-y-2">
              {t.hallNames.map((name) => (
                <li
                  key={name}
                  className="flex items-center gap-2 text-sm text-neutral-600"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                  {name}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </Section>
  );
}
