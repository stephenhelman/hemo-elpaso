import Section from "@/components/layout/Section";
import HoepCard from "@/components/ui/HoepCard";
import { ExternalLink } from "lucide-react";
import { Lang } from "@/types";
import { conditionCardsTranslation } from "@/translation/resourcesPage";
import { colorMap } from "@/lib/statColorConfig";

interface Props {
  locale: Lang;
}

export default function ConditionCards({ locale }: Props) {
  const t = conditionCardsTranslation[locale];

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
