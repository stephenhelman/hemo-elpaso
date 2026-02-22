import Section from "@/components/layout/Section";
import { ExternalLink, DollarSign, Shield, Phone } from "lucide-react";
import { Lang } from "@/types";
import { insuranceResourcesTranslation } from "@/translation/resourcesPage";
import HoepCard from "../ui/HoepCard";
import React from "react";

interface Props {
  lang: Lang;
}

export default function InsuranceResources({ lang }: Props) {
  const t = insuranceResourcesTranslation[lang];
  const iconConfig: Record<string, React.ReactNode> = {
    dollarSign: <DollarSign className={t.resourceClassName} />,
    shield: <Shield className={t.resourceClassName} />,
    phone: <Phone className={t.resourceClassName} />,
  };

  return (
    <Section background="neutral" id="financial">
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {t.resources.map((resource) => (
          <HoepCard key={resource.title}>
            <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center text-primary mb-4">
              {iconConfig[resource.icon]}
            </div>
            <h3 className="font-display font-bold text-neutral-900 mb-2">
              {resource.title}
            </h3>
            <p className="text-neutral-500 text-sm leading-relaxed mb-5 flex-1">
              {resource.body}
            </p>
            <a
              href={resource.link}
              target={resource.internal ? undefined : "_blank"}
              rel={resource.internal ? undefined : "noopener noreferrer"}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary-600 transition-colors"
            >
              {resource.cta}
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </HoepCard>
        ))}
      </div>
    </Section>
  );
}
