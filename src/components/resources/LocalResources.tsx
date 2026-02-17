import Section from "@/components/layout/Section";
import HoepCard from "@/components/ui/HoepCard";
import { MapPin, Phone, ExternalLink } from "lucide-react";
import { Lang } from "@/types";

interface Props {
  lang: Lang;
}

const content = {
  en: {
    eyebrow: "Local Care",
    heading: "El Paso Area Resources",
    sub: "Local healthcare providers and specialty care centers serving the bleeding disorders community in El Paso.",
    providers: [
      {
        name: "University Medical Center of El Paso",
        abbr: "UMC",
        type: "Regional Medical Center",
        address: "4815 Alameda Ave, El Paso, TX 79905",
        phone: "(915) 521-7602",
        body: "The region's leading safety-net hospital with hematology services and specialty care for bleeding disorders.",
        link: "https://www.umcelpaso.org",
        color: "primary",
      },
      {
        name: "Texas Tech HSC El Paso",
        abbr: "TTHSC",
        type: "Academic Medical Center",
        address: "5001 El Paso Dr, El Paso, TX 79905",
        phone: "(915) 215-4000",
        body: "Academic medical center providing hematology specialty care, research, and comprehensive bleeding disorder treatment.",
        link: "https://elpaso.ttuhsc.edu",
        color: "secondary",
      },
      {
        name: "El Paso Children's Hospital",
        abbr: "EPCH",
        type: "Pediatric Care",
        address: "4845 Alameda Ave, El Paso, TX 79905",
        phone: "(915) 298-5444",
        body: "Dedicated pediatric care for children with bleeding disorders, including hematology specialty services.",
        link: "https://www.elpasochildrens.org",
        color: "accent",
      },
    ],
  },
  es: {
    eyebrow: "Atención Local",
    heading: "Recursos del Área de El Paso",
    sub: "Proveedores de atención médica locales y centros de atención especializada que sirven a la comunidad de trastornos hemorrágicos en El Paso.",
    providers: [
      {
        name: "Centro Médico Universitario de El Paso",
        abbr: "UMC",
        type: "Centro Médico Regional",
        address: "4815 Alameda Ave, El Paso, TX 79905",
        phone: "(915) 521-7602",
        body: "El hospital de red de seguridad líder de la región con servicios de hematología y atención especializada para trastornos hemorrágicos.",
        link: "https://www.umcelpaso.org",
        color: "primary",
      },
      {
        name: "Texas Tech HSC El Paso",
        abbr: "TTHSC",
        type: "Centro Médico Académico",
        address: "5001 El Paso Dr, El Paso, TX 79905",
        phone: "(915) 215-4000",
        body: "Centro médico académico que brinda atención especializada en hematología, investigación y tratamiento integral de trastornos hemorrágicos.",
        link: "https://elpaso.ttuhsc.edu",
        color: "secondary",
      },
      {
        name: "Hospital Infantil de El Paso",
        abbr: "EPCH",
        type: "Atención Pediátrica",
        address: "4845 Alameda Ave, El Paso, TX 79905",
        phone: "(915) 298-5444",
        body: "Atención pediátrica dedicada para niños con trastornos hemorrágicos, incluidos servicios especializados de hematología.",
        link: "https://www.elpasochildrens.org",
        color: "accent",
      },
    ],
  },
};

const avatarColors: Record<string, string> = {
  primary: "bg-gradient-to-br from-primary-400 to-primary-600",
  secondary: "bg-gradient-to-br from-secondary/70 to-secondary",
  accent: "bg-gradient-to-br from-accent/70 to-accent",
};

export default function LocalResources({ lang }: Props) {
  const t = content[lang];

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
