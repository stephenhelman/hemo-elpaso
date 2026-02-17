import Link from "next/link";
import Section from "@/components/layout/Section";
import { ArrowRight, Bell } from "lucide-react";
import { Lang } from "@/types";

interface Props {
  lang: Lang;
}

const content = {
  en: {
    heading: "Want to Be Notified About Future Scholarships?",
    sub: "Sign up for our newsletter to be the first to know when the next scholarship cycle opens.",
    cta1: "Subscribe to Newsletter",
    cta2: "Contact Us",
  },
  es: {
    heading: "¿Quiere ser Notificado sobre Futuras Becas?",
    sub: "Suscríbase a nuestro boletín para ser el primero en saber cuándo abre el próximo ciclo de becas.",
    cta1: "Suscribirse al Boletín",
    cta2: "Contáctenos",
  },
};

export default function ScholarshipCTA({ lang }: Props) {
  const t = content[lang];

  return (
    <Section background="white">
      <div className="max-w-2xl mx-auto text-center">
        <div className="w-14 h-14 rounded-full bg-primary-50 flex items-center justify-center mx-auto mb-6">
          <Bell className="w-7 h-7 text-primary" />
        </div>
        <h2 className="font-display text-3xl font-bold text-neutral-900 mb-4">
          {t.heading}
        </h2>
        <p className="text-neutral-500 text-lg mb-8 leading-relaxed">{t.sub}</p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link
            href="/#newsletter"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-primary text-white font-display font-semibold hover:bg-primary-600 transition-colors group"
          >
            <Bell className="w-4 h-4" />
            {t.cta1}
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full border-2 border-neutral-300 text-neutral-700 font-display font-semibold hover:border-primary hover:text-primary transition-colors"
          >
            {t.cta2}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </Section>
  );
}
