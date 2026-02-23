import { Lang } from "@/types";
import { scholarshipHeroTranslation } from "@/translation/scholarshipsPage";

interface Props {
  locale: Lang;
}

export default function ScholarshipsHero({ locale }: Props) {
  const t = scholarshipHeroTranslation[locale];

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
