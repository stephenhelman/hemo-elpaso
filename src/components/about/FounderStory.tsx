import Section from "@/components/layout/Section";
import { Heart } from "lucide-react";

interface Props {
  lang: "en" | "es";
}

const content = {
  en: {
    eyebrow: "Our Founder",
    heading: "A Mother's Love, A Community's Hope",
    paragraphs: [
      "In 1993, Lou Anne Fetters — a mother raising a child with hemophilia — recognized a gap in support for families navigating bleeding disorders in the El Paso region. Rather than accept that gap, she built something to fill it.",
      "What began as a small group of families sharing resources and experiences has grown into a recognized 501(c)(3) nonprofit organization serving the greater El Paso community for over three decades.",
      "Lou Anne's vision was simple but powerful: no family should face a bleeding disorder diagnosis alone. That vision remains the heartbeat of everything HOEP does today.",
    ],
    founder: "Lou Anne Fetters",
    founderTitle: "Founder, Hemophilia Outreach of El Paso (1993)",
    hallOfFame: "Past President Hall of Fame",
    hallNames: [
      "Lou Anne Fetters",
      "Rosamaria Coles",
      "Felix Garcia",
      "Yolanda Ortiz",
    ],
  },
  es: {
    eyebrow: "Nuestra Fundadora",
    heading: "El Amor de una Madre, la Esperanza de una Comunidad",
    paragraphs: [
      "En 1993, Lou Anne Fetters — una madre criando a un hijo con hemofilia — reconoció una brecha en el apoyo para las familias que navegaban por los trastornos hemorrágicos en la región de El Paso. En lugar de aceptar esa brecha, construyó algo para llenarla.",
      "Lo que comenzó como un pequeño grupo de familias compartiendo recursos y experiencias ha crecido hasta convertirse en una organización sin fines de lucro 501(c)(3) reconocida que sirve a la comunidad del gran El Paso durante más de tres décadas.",
      "La visión de Lou Ann era simple pero poderosa: ninguna familia debería enfrentar un diagnóstico de trastorno hemorrágico sola. Esa visión sigue siendo el corazón de todo lo que HOEP hace hoy.",
    ],
    founder: "Lou Anne Fetters",
    founderTitle: "Fundadora, Hemophilia Outreach de El Paso (1993)",
    hallOfFame: "Pasados Presidentes - Salón de la Fama",
    hallNames: [
      "Lou Anne Fetters",
      "Rosamaria Coles",
      "Felix Garcia",
      "Yolanda Ortiz",
    ],
  },
};

export default function FounderStory({ lang }: Props) {
  const t = content[lang];

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
              {lang === "en" ? "Year Founded" : "Año de Fundación"}
            </p>
            <p className="text-primary-100 text-sm">
              {lang === "en"
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
