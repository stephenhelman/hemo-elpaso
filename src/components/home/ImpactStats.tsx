import { ImpactStatCard } from "./ImpactStatCard";
import Section from "@/components/layout/Section";

interface ImpactStatsProps {
  lang: "en" | "es";
}

const content = {
  en: {
    heading: "Our Impact",
    sub: "Making a difference in the El Paso bleeding disorders community",
    stats: [
      { value: 150, suffix: "+", label: "Families Served" },
      { value: 12, suffix: "+", label: "Years of Service" },
      { value: 50, suffix: "+", label: "Events Hosted" },
      { value: 100, suffix: "%", label: "Free of Charge" },
    ],
  },
  es: {
    heading: "Nuestro Impacto",
    sub: "Haciendo una diferencia en la comunidad de trastornos hemorrágicos de El Paso",
    stats: [
      { value: 150, suffix: "+", label: "Familias Atendidas" },
      { value: 12, suffix: "+", label: "Años de Servicio" },
      { value: 50, suffix: "+", label: "Eventos Realizados" },
      { value: 100, suffix: "%", label: "Gratuito" },
    ],
  },
};

export default function ImpactStats({ lang }: ImpactStatsProps) {
  const t = content[lang];

  return (
    <Section background="white" id="impact">
      <div className="text-center mb-12">
        <h2 className="font-display text-3xl font-bold text-neutral-900 mb-3">
          {t.heading}
        </h2>
        <p className="text-neutral-500 max-w-xl mx-auto">{t.sub}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {t.stats.map((stat) => (
          <ImpactStatCard key={stat.label} {...stat} />
        ))}
      </div>
    </Section>
  );
}
