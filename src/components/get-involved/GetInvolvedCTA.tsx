import Link from "next/link";
import Section from "@/components/layout/Section";
import { ArrowRight } from "lucide-react";
import { Lang } from "@/types";

interface Props {
  lang: Lang;
}

const content = {
  en: {
    heading: "Ready to Make a Difference?",
    sub: "Every volunteer, every sponsor, and every advocate helps HOEP serve more families in the El Paso bleeding disorders community.",
    cta1: "Volunteer Now",
    cta2: "Contact Us",
  },
  es: {
    heading: "¿Listo para Hacer una Diferencia?",
    sub: "Cada voluntario, cada patrocinador y cada defensor ayuda a HOEP a servir a más familias en la comunidad de trastornos hemorrágicos de El Paso.",
    cta1: "Ser Voluntario",
    cta2: "Contáctenos",
  },
};

export default function GetInvolvedCTA({ lang }: Props) {
  const t = content[lang];

  return (
    <Section background="white">
      <div className="max-w-2xl mx-auto text-center">
        <h2 className="font-display text-3xl sm:text-4xl font-bold text-neutral-900 mb-4">
          {t.heading}
        </h2>
        <p className="text-neutral-500 text-lg mb-8 leading-relaxed">{t.sub}</p>
        <div className="flex flex-wrap gap-4 justify-center">
          <a
            href="#volunteer"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-primary text-white font-display font-semibold hover:bg-primary-600 transition-colors group"
          >
            {t.cta1}
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </a>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full border-2 border-neutral-300 text-neutral-700 font-display font-semibold hover:border-primary hover:text-primary transition-colors"
          >
            {t.cta2}
          </Link>
        </div>
      </div>
    </Section>
  );
}
