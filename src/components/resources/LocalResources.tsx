import Section from "@/components/layout/Section";
import HoepCard from "@/components/ui/HoepCard";
import { MapPin, Phone, ExternalLink } from "lucide-react";
import { Lang } from "@/types";
import { avatarColors } from "@/lib/statColorConfig";
import { localResourcesTranslation } from "@/translation/resourcesPage";

interface Props {
  locale: Lang;
}

export default function LocalResources({ locale }: Props) {
  const t = localResourcesTranslation[locale];

  return (
    <Section background="neutral" id="local">
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {t.providers.map((provider) => (
          <HoepCard key={provider.abbr} className="flex flex-col">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <div
                className={`w-12 h-12 rounded-xl ${avatarColors[provider.color]} flex items-center justify-center flex-shrink-0`}
              >
                <span className="font-display font-bold text-white text-xs">
                  {provider.abbr}
                </span>
              </div>
              <div>
                <p className="text-xs text-neutral-400 font-medium">
                  {provider.type}
                </p>
                <h3 className="font-display font-bold text-neutral-900 text-sm leading-snug">
                  {provider.name}
                </h3>
              </div>
            </div>

            <p className="text-neutral-500 text-sm leading-relaxed mb-4">
              {provider.body}
            </p>

            <div className="space-y-2 mb-5 mt-auto">
              <div className="flex items-start gap-2 text-xs text-neutral-500">
                <MapPin className="w-3.5 h-3.5 text-primary-400 flex-shrink-0 mt-0.5" />
                <span>{provider.address}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-neutral-500">
                <Phone className="w-3.5 h-3.5 text-primary-400 flex-shrink-0" />
                <a
                  href={`tel:${provider.phone.replace(/\D/g, "")}`}
                  className="hover:text-primary transition-colors"
                >
                  {provider.phone}
                </a>
              </div>
            </div>

            <a
              href={provider.link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary-600 transition-colors"
            >
              Visit Website
              <ExternalLink className="w-3 h-3" />
            </a>
          </HoepCard>
        ))}
      </div>
    </Section>
  );
}
