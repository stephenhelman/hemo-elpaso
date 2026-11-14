"use client";

import Link from "next/link";
import { ClipboardList } from "lucide-react";
import Section from "@/components/layout/Section";
import { registerInfoSectionTranslation } from "@/translation/registerInfoPage";
import { Lang } from "@/types";

export default function RegisterInfoSection({ locale }: { locale: Lang }) {
  const t = registerInfoSectionTranslation[locale];
  return (
    <Section background="primary" id="register-info">
      <div className="max-w-2xl mx-auto text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-white/10 mb-6">
          <ClipboardList className="w-7 h-7 text-white" />
        </div>
        <h2 className="font-display text-3xl lg:text-4xl font-bold text-white mb-4">
          {t.heading}
        </h2>
        <p className="text-primary-100 mb-8 text-lg">{t.sub}</p>
        <Link
          href="/register-info"
          className="inline-flex px-8 py-3.5 rounded-full bg-white text-primary font-display font-bold text-sm hover:bg-primary-50 transition-colors"
        >
          {t.cta}
        </Link>
      </div>
    </Section>
  );
}
