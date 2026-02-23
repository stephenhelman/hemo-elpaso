"use client";

import Section from "@/components/layout/Section";
import { Heart, Star } from "lucide-react";
import { founderSpotlightTranslation } from "@/translation/aboutPage";

import { Lang } from "@/types";

interface Props {
  locale: Lang;
}

export default function FounderSpotlight({ locale }: Props) {
  const t = founderSpotlightTranslation[locale];

  return (
    <Section background="white">
      {/* Eyebrow */}
      <div className="flex items-center justify-center gap-2 mb-12">
        <div className="w-8 h-0.5 bg-primary-400" />
        <span className="text-primary-500 text-sm font-semibold tracking-widest uppercase">
          {t.eyebrow}
        </span>
        <div className="w-8 h-0.5 bg-primary-400" />
      </div>

      {/* Main card */}
      <div className="max-w-4xl mx-auto">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-neutral-900 via-primary-900 to-neutral-900 p-8 sm:p-12">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-primary-500/10 -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-secondary/10 translate-y-1/2 -translate-x-1/3" />

          <div className="relative z-10 flex flex-col sm:flex-row gap-8 items-start">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <div className="relative">
                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                  <span className="font-display font-bold text-white text-3xl sm:text-4xl">
                    LF
                  </span>
                </div>
                {/* Star badge */}
                <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-accent flex items-center justify-center shadow-lg">
                  <Star className="w-5 h-5 text-white fill-white" />
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1">
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-white mb-1">
                {t.name}
              </h2>
              <p className="text-primary-400 font-semibold mb-1">{t.title}</p>
              <p className="text-neutral-400 text-sm mb-6">{t.founded}</p>

              {/* Quote */}
              <blockquote className="border-l-4 border-primary-400 pl-4 mb-6">
                <p className="text-white text-lg italic leading-relaxed">
                  {t.quote}
                </p>
              </blockquote>

              <p className="text-neutral-300 leading-relaxed mb-8">{t.body}</p>

              {/* Badges */}
              <div className="flex flex-wrap gap-2">
                {[t.badge1, t.badge2, t.badge3].map((badge) => (
                  <span
                    key={badge}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 border border-white/10 text-white text-xs font-medium"
                  >
                    <Heart className="w-3 h-3 text-primary-400 fill-primary-400" />
                    {badge}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}
