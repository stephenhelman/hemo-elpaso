import Section from "@/components/layout/Section";
import { ExternalLink, Sun } from "lucide-react";
import { Lang } from "@/types";
import { campProgramTranslation } from "@/translation/resourcesPage";

interface Props {
  locale: Lang;
}

export default function CampPrograms({ locale }: Props) {
  const t = campProgramTranslation[locale];

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
