import Section from "@/components/layout/Section";

interface Props {
  lang: "en" | "es";
}

const content = {
  en: {
    eyebrow: "Our Story",
    heading: "Three Decades of Hope",
    sub: "Founded in 1993 by Lou Anne Fetters, Hemophilia Outreach of El Paso has spent over 30 years standing beside individuals and families affected by bleeding disorders in our community.",
  },
  es: {
    eyebrow: "Nuestra Historia",
    heading: "Tres Décadas de Esperanza",
    sub: "Fundada en 1993 por Lou Anne Fetters, Hemophilia Outreach de El Paso ha pasado más de 30 años apoyando a individuos y familias afectadas por trastornos hemorrágicos en nuestra comunidad.",
  },
};

export default function AboutHero({ lang }: Props) {
  const t = content[lang];

  return (
    <div className="relative bg-gradient-to-br from-neutral-900 via-primary-900 to-neutral-900 py-24">
      {/* Decorative circle */}
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-primary-500/10 -translate-y-1/2 translate-x-1/3" />

      <div className="container-max px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-0.5 bg-primary-400" />
            <span className="text-primary-400 text-sm font-semibold tracking-widest uppercase">
              {t.eyebrow}
            </span>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-white leading-[1.2] mb-6">
            {t.heading}
          </h1>
          <p className="text-lg text-neutral-300 leading-relaxed max-w-2xl">
            {t.sub}
          </p>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-neutral-50 to-transparent" />
    </div>
  );
}
