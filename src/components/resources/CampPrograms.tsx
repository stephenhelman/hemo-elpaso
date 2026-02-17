import Section from "@/components/layout/Section";
import { ExternalLink, Sun, Heart } from "lucide-react";
import { Lang } from "@/types";

interface Props {
  lang: Lang;
}

const content = {
  en: {
    eyebrow: "Youth Programs",
    heading: "Camps & Youth Opportunities",
    sub: "Special programs designed to give children and teens with bleeding disorders meaningful experiences in safe, supportive environments.",
    camps: [
      {
        name: "Camp Bold Eagle",
        org: "Texas Central States Region",
        body: "A summer camp specifically designed for children with bleeding disorders. Kids aged 6-17 enjoy traditional camp activities in a medically supervised, safe environment. Campers build confidence, friendships, and independence.",
        link: "https://www.hemophilia.org/community-resources/camps",
        ages: "Ages 6–17",
        season: "Summer",
        cost: "Scholarships Available",
      },
      {
        name: "NHF Youth Programs",
        org: "National Hemophilia Foundation",
        body: "National leadership and educational programs for teens and young adults with bleeding disorders. Includes Washington Days advocacy training and annual meeting youth programming.",
        link: "https://www.hemophilia.org/community-resources/youth-programs",
        ages: "Ages 13–25",
        season: "Year Round",
        cost: "Free to Attend",
      },
    ],
  },
  es: {
    eyebrow: "Programas Juveniles",
    heading: "Campamentos y Oportunidades para Jóvenes",
    sub: "Programas especiales diseñados para brindar a niños y adolescentes con trastornos hemorrágicos experiencias significativas en entornos seguros y de apoyo.",
    camps: [
      {
        name: "Camp Bold Eagle",
        org: "Región Central de Texas",
        body: "Un campamento de verano diseñado específicamente para niños con trastornos hemorrágicos. Niños de 6 a 17 años disfrutan de actividades tradicionales de campamento en un entorno médicamente supervisado y seguro.",
        link: "https://www.hemophilia.org/community-resources/camps",
        ages: "Edades 6–17",
        season: "Verano",
        cost: "Becas Disponibles",
      },
      {
        name: "Programas Juveniles NHF",
        org: "Fundación Nacional de Hemofilia",
        body: "Programas nacionales de liderazgo y educación para adolescentes y adultos jóvenes con trastornos hemorrágicos. Incluye capacitación en defensa de Washington Days.",
        link: "https://www.hemophilia.org/community-resources/youth-programs",
        ages: "Edades 13–25",
        season: "Todo el Año",
        cost: "Gratis",
      },
    ],
  },
};

export default function CampPrograms({ lang }: Props) {
  const t = content[lang];

  return (
    <Section background="white" id="camps">
      <div className="text-center mb-12">
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="w-8 h-0.5 bg-primary-400" />
          <span className="text-primary-500 text-sm font-semibold tracking-widest uppercase">
            {t.eyebrow}
          </span>
          <div className="w-8 h-0.5 bg-primary-400" />
        </div>
        <h2 className="font-display text-3xl font-bold text-neutral-900 mb-3">
          {t.heading}
        </h2>
        <p className="text-neutral-500 max-w-xl mx-auto">{t.sub}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {t.camps.map((camp) => (
          <div
            key={camp.name}
            className="relative rounded-2xl border border-neutral-200 overflow-hidden bg-white hover:border-primary-200 hover:shadow-md transition-all duration-200"
          >
            {/* Top color bar */}
            <div className="h-2 bg-gradient-to-r from-primary-500 to-secondary" />

            <div className="p-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center flex-shrink-0">
                  <Sun className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-neutral-900">
                    {camp.name}
                  </h3>
                  <p className="text-xs text-neutral-400">{camp.org}</p>
                </div>
              </div>

              <p className="text-neutral-600 text-sm leading-relaxed mb-5">
                {camp.body}
              </p>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-5">
                <CampTag label={camp.ages} />
                <CampTag label={camp.season} />
                <CampTag label={camp.cost} highlight />
              </div>

              <a
                href={camp.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary-600 transition-colors"
              >
                Learn More
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

function CampTag({ label, highlight }: { label: string; highlight?: boolean }) {
  return (
    <span
      className={`text-xs font-medium px-2.5 py-1 rounded-full ${
        highlight
          ? "bg-secondary/10 text-secondary-700 border border-secondary/20"
          : "bg-neutral-100 text-neutral-600 border border-neutral-200"
      }`}
    >
      {label}
    </span>
  );
}
