import { Lang } from "@/types";

interface Props {
  lang: Lang;
}

const content = {
  en: {
    eyebrow: "Educational Support",
    heading: "Scholarships",
    sub: "Hemophilia Outreach of El Paso is proud to support students affected by bleeding disorders in pursuing their education in healthcare and pharmacy.",
  },
  es: {
    eyebrow: "Apoyo Educativo",
    heading: "Becas",
    sub: "Hemophilia Outreach de El Paso se enorgullece de apoyar a estudiantes afectados por trastornos hemorrágicos en la búsqueda de su educación en atención médica y farmacia.",
  },
};

export default function ScholarshipsHero({ lang }: Props) {
  const t = content[lang];

  return (
    <div className="relative bg-gradient-to-br from-neutral-900 via-primary-900 to-neutral-900 py-24">
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-primary-500/10 -translate-y-1/2 translate-x-1/3" />
      <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-secondary/10 translate-y-1/2 -translate-x-1/3" />
      <div className="container-max px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-0.5 bg-primary-400" />
            <span className="text-primary-400 text-sm font-semibold tracking-widest uppercase">
              {t.eyebrow}
            </span>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-white leading-[1.2] mb-6">
            {t.heading}
          </h1>
          <p className="text-lg text-neutral-300 leading-relaxed">{t.sub}</p>
        </div>
      </div>
      <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-neutral-50 to-transparent" />
    </div>
  );
}
