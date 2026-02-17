import Section from "@/components/layout/Section";
import HoepCard from "@/components/ui/HoepCard";
import { ExternalLink } from "lucide-react";
import { Lang } from "@/types";

interface Props {
  lang: Lang;
}

const content = {
  en: {
    eyebrow: "Understanding Bleeding Disorders",
    heading: "Condition Information",
    sub: "Learn about the conditions we support and how they affect daily life.",
    conditions: [
      {
        name: "Hemophilia A",
        color: "primary",
        abbr: "HA",
        what: "What is it?",
        body: "Hemophilia A is the most common form of hemophilia, caused by a deficiency of clotting factor VIII. It is an inherited bleeding disorder where the blood does not clot properly.",
        facts: [
          "Affects approximately 1 in 5,000 male births",
          "Caused by mutations in the F8 gene on the X chromosome",
          "Ranges from mild to severe based on factor levels",
          "Treatment involves factor VIII replacement therapy",
        ],
        link: "https://www.hemophilia.org/bleeding-disorders-a-z/types/hemophilia-a",
        linkLabel: "Learn More at NHF",
      },
      {
        name: "Hemophilia B",
        color: "secondary",
        abbr: "HB",
        what: "What is it?",
        body: "Hemophilia B, also called Christmas Disease, is caused by a deficiency of clotting factor IX. It is less common than Hemophilia A but presents similarly.",
        facts: [
          "Affects approximately 1 in 30,000 male births",
          "Caused by mutations in the F9 gene on the X chromosome",
          "Named after Stephen Christmas, the first patient described",
          "Treated with factor IX replacement or gene therapy",
        ],
        link: "https://www.hemophilia.org/bleeding-disorders-a-z/types/hemophilia-b",
        linkLabel: "Learn More at NHF",
      },
      {
        name: "Von Willebrand Disease",
        color: "accent",
        abbr: "VWD",
        what: "What is it?",
        body: "Von Willebrand Disease is the most common inherited bleeding disorder, affecting both males and females equally. It involves a deficiency or dysfunction of Von Willebrand factor.",
        facts: [
          "Affects up to 1% of the general population",
          "Three main types: Type 1, Type 2, and Type 3",
          "Often underdiagnosed, especially in women",
          "Treatment includes desmopressin (DDAVP) or factor replacement",
        ],
        link: "https://www.hemophilia.org/bleeding-disorders-a-z/types/von-willebrand-disease",
        linkLabel: "Learn More at NHF",
      },
    ],
  },
  es: {
    eyebrow: "Comprender los Trastornos Hemorrágicos",
    heading: "Información sobre Condiciones",
    sub: "Aprenda sobre las condiciones que apoyamos y cómo afectan la vida diaria.",
    conditions: [
      {
        name: "Hemofilia A",
        color: "primary",
        abbr: "HA",
        what: "¿Qué es?",
        body: "La hemofilia A es la forma más común de hemofilia, causada por una deficiencia del factor de coagulación VIII. Es un trastorno hemorrágico hereditario donde la sangre no coagula correctamente.",
        facts: [
          "Afecta aproximadamente a 1 de cada 5,000 nacimientos masculinos",
          "Causada por mutaciones en el gen F8 en el cromosoma X",
          "Varía de leve a severa según los niveles del factor",
          "El tratamiento implica terapia de reemplazo del factor VIII",
        ],
        link: "https://www.hemophilia.org/bleeding-disorders-a-z/types/hemophilia-a",
        linkLabel: "Más Información en NHF",
      },
      {
        name: "Hemofilia B",
        color: "secondary",
        abbr: "HB",
        what: "¿Qué es?",
        body: "La hemofilia B, también llamada Enfermedad de Christmas, es causada por una deficiencia del factor de coagulación IX. Es menos común que la hemofilia A pero se presenta de manera similar.",
        facts: [
          "Afecta aproximadamente a 1 de cada 30,000 nacimientos masculinos",
          "Causada por mutaciones en el gen F9 en el cromosoma X",
          "Named after Stephen Christmas, el primer paciente descrito",
          "Se trata con reemplazo de factor IX o terapia génica",
        ],
        link: "https://www.hemophilia.org/bleeding-disorders-a-z/types/hemophilia-b",
        linkLabel: "Más Información en NHF",
      },
      {
        name: "Enfermedad de Von Willebrand",
        color: "accent",
        abbr: "VWD",
        what: "¿Qué es?",
        body: "La enfermedad de Von Willebrand es el trastorno hemorrágico hereditario más común, que afecta por igual a hombres y mujeres. Implica una deficiencia o disfunción del factor de Von Willebrand.",
        facts: [
          "Afecta hasta al 1% de la población general",
          "Tres tipos principales: Tipo 1, Tipo 2 y Tipo 3",
          "A menudo no se diagnostica, especialmente en mujeres",
          "El tratamiento incluye desmopresina (DDAVP) o reemplazo de factores",
        ],
        link: "https://www.hemophilia.org/bleeding-disorders-a-z/types/von-willebrand-disease",
        linkLabel: "Más Información en NHF",
      },
    ],
  },
};

const colorMap: Record<
  string,
  { bg: string; text: string; border: string; avatar: string }
> = {
  primary: {
    bg: "bg-primary-50",
    text: "text-primary-700",
    border: "border-primary-200",
    avatar: "bg-gradient-to-br from-primary-400 to-primary-600",
  },
  secondary: {
    bg: "bg-secondary/10",
    text: "text-secondary-700",
    border: "border-secondary/20",
    avatar: "bg-gradient-to-br from-secondary/70 to-secondary",
  },
  accent: {
    bg: "bg-accent/10",
    text: "text-accent-dark",
    border: "border-accent/20",
    avatar: "bg-gradient-to-br from-accent/70 to-accent",
  },
};

export default function ConditionCards({ lang }: Props) {
  const t = content[lang];

  return (
    <Section background="neutral" id="conditions">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {t.conditions.map((condition) => {
          const colors = colorMap[condition.color];
          return (
            <HoepCard key={condition.name} className="flex flex-col">
              {/* Header */}
              <div className="flex items-center gap-4 mb-5">
                <div
                  className={`w-14 h-14 rounded-2xl ${colors.avatar} flex items-center justify-center flex-shrink-0`}
                >
                  <span className="font-display font-bold text-white text-sm">
                    {condition.abbr}
                  </span>
                </div>
                <h3 className="font-display font-bold text-neutral-900 text-lg leading-snug">
                  {condition.name}
                </h3>
              </div>

              {/* What is it */}
              <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-1">
                {condition.what}
              </p>
              <p className="text-neutral-600 text-sm leading-relaxed mb-5">
                {condition.body}
              </p>

              {/* Facts */}
              <ul className="space-y-2 mb-6">
                {condition.facts.map((fact) => (
                  <li
                    key={fact}
                    className="flex items-start gap-2 text-sm text-neutral-600"
                  >
                    <div
                      className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${
                        condition.color === "primary"
                          ? "bg-primary"
                          : condition.color === "secondary"
                            ? "bg-secondary"
                            : "bg-accent"
                      }`}
                    />
                    {fact}
                  </li>
                ))}
              </ul>

              {/* Link */}
              <div className="mt-auto">
                <a
                  href={condition.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-full border ${colors.bg} ${colors.text} ${colors.border} hover:opacity-80 transition-opacity`}
                >
                  {condition.linkLabel}
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </HoepCard>
          );
        })}
      </div>
    </Section>
  );
}
