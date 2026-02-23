import Section from "@/components/layout/Section";
import { ExternalLink } from "lucide-react";
import { Lang } from "@/types";
import { nationalOrgTranslation } from "@/translation/resourcesPage";
import { avatarColors } from "@/lib/statColorConfig";

interface Props {
  locale: Lang;
}

export default function NationalOrgs({ locale }: Props) {
  const t = nationalOrgTranslation[locale];

  return (
    <Section background="white" id="national">
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {t.orgs.map((org) => (
          <a
            key={org.abbr}
            href={org.link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex gap-4 p-6 rounded-2xl border border-neutral-200 hover:border-primary-200 hover:shadow-md transition-all duration-200 group bg-white"
          >
            <div
              className={`w-14 h-14 rounded-2xl ${avatarColors[org.color]} flex items-center justify-center flex-shrink-0`}
            >
              <span className="font-display font-bold text-white text-xs">
                {org.abbr}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="font-display font-bold text-neutral-900 text-sm leading-snug group-hover:text-primary transition-colors">
                  {org.name}
                </h3>
                <ExternalLink className="w-4 h-4 text-neutral-300 group-hover:text-primary transition-colors flex-shrink-0 mt-0.5" />
              </div>
              <p className="text-neutral-500 text-sm leading-relaxed">
                {org.body}
              </p>
            </div>
          </a>
        ))}
      </div>
    </Section>
  );
}
