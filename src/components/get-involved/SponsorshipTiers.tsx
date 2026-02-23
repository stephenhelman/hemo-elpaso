import Section from "@/components/layout/Section";
import { Check } from "lucide-react";
import { Lang } from "@/types";

interface Props {
  locale: Lang;
}

const content = {
  en: {
    eyebrow: "Sponsorship",
    heading: "Sponsorship Opportunities",
    sub: "Your sponsorship directly funds community programs, educational events, and family support services. All sponsors receive recognition at our events.",
    contact: "Interested in sponsoring? Contact us at",
    tiers: [
      {
        name: "Community Supporter",
        price: "$250",
        color: "neutral",
        perks: [
          "Name listed in event programs",
          "Social media recognition",
          "Certificate of appreciation",
        ],
      },
      {
        name: "Silver Sponsor",
        price: "$500",
        color: "secondary",
        featured: false,
        perks: [
          "Everything in Community Supporter",
          "Logo on event banners",
          "Table for 2 at educational dinner",
          "Quarterly newsletter feature",
        ],
      },
      {
        name: "Gold Sponsor",
        price: "$1,000",
        color: "primary",
        featured: true,
        perks: [
          "Everything in Silver Sponsor",
          "Table for 4 at educational dinner",
          "Speaking opportunity at event",
          "Logo on HOEP website",
          "Live engagement at sponsored event",
        ],
      },
      {
        name: "Platinum Sponsor",
        price: "$2,500+",
        color: "accent",
        featured: false,
        perks: [
          "Everything in Gold Sponsor",
          "Named event sponsorship",
          "Full table at Annual Gala",
          "Live sponsor dashboard & analytics",
          "Custom ROI report post-event",
          "First right of refusal next year",
        ],
      },
    ],
  },
  es: {
    eyebrow: "Patrocinio",
    heading: "Oportunidades de Patrocinio",
    sub: "Su patrocinio financia directamente programas comunitarios, eventos educativos y servicios de apoyo familiar. Todos los patrocinadores reciben reconocimiento en nuestros eventos.",
    contact: "¿Interesado en patrocinar? Contáctenos en",
    tiers: [
      {
        name: "Colaborador Comunitario",
        price: "$250",
        color: "neutral",
        perks: [
          "Nombre en los programas del evento",
          "Reconocimiento en redes sociales",
          "Certificado de agradecimiento",
        ],
      },
      {
        name: "Patrocinador Plata",
        price: "$500",
        color: "secondary",
        featured: false,
        perks: [
          "Todo en Colaborador Comunitario",
          "Logo en pancartas del evento",
          "Mesa para 2 en cena educativa",
          "Mención en boletín trimestral",
        ],
      },
      {
        name: "Patrocinador Oro",
        price: "$1,000",
        color: "primary",
        featured: true,
        perks: [
          "Todo en Patrocinador Plata",
          "Mesa para 4 en cena educativa",
          "Oportunidad de hablar en el evento",
          "Logo en el sitio web de HOEP",
          "Participación en vivo en el evento",
        ],
      },
      {
        name: "Patrocinador Platino",
        price: "$2,500+",
        color: "accent",
        featured: false,
        perks: [
          "Todo en Patrocinador Oro",
          "Patrocinio de evento con nombre",
          "Mesa completa en Gala Anual",
          "Panel de patrocinador en vivo",
          "Informe de ROI personalizado",
          "Primer derecho de rechazo el próximo año",
        ],
      },
    ],
  },
};

const tierStyles: Record<
  string,
  {
    border: string;
    header: string;
    check: string;
    badge?: string;
  }
> = {
  neutral: {
    border: "border-neutral-200",
    header: "bg-neutral-50",
    check: "text-neutral-500",
  },
  secondary: {
    border: "border-secondary/20",
    header: "bg-secondary/5",
    check: "text-secondary",
  },
  primary: {
    border: "border-primary-200",
    header: "bg-primary-500 text-white",
    check: "text-white",
    badge: "Most Popular",
  },
  accent: {
    border: "border-accent/20",
    header: "bg-accent/5",
    check: "text-accent-dark",
  },
};

export default function SponsorshipTiers({ locale }: Props) {
  const t = content[locale];

  return (
    <Section background="neutral" id="sponsorship">
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {t.tiers.map((tier) => {
          const styles = tierStyles[tier.color];
          const isFeatured = tier.color === "primary";

          return (
            <div
              key={tier.name}
              className={`relative rounded-2xl border overflow-hidden ${styles.border} ${
                isFeatured ? "shadow-lg shadow-primary/10 scale-[1.02]" : ""
              } bg-white`}
            >
              {isFeatured && (
                <div className="absolute top-0 inset-x-0 text-center py-1 bg-primary text-white text-xs font-semibold">
                  ★ Most Popular
                </div>
              )}

              {/* Header */}
              <div
                className={`px-5 py-5 ${isFeatured ? "pt-8" : ""} ${
                  isFeatured
                    ? "bg-primary"
                    : "bg-neutral-50 border-b border-neutral-100"
                }`}
              >
                <h3
                  className={`font-display font-bold text-sm mb-1 ${
                    isFeatured ? "text-white" : "text-neutral-900"
                  }`}
                >
                  {tier.name}
                </h3>
                <p
                  className={`font-display font-bold text-3xl ${
                    isFeatured ? "text-white" : "text-neutral-900"
                  }`}
                >
                  {tier.price}
                </p>
              </div>

              {/* Perks */}
              <div className="px-5 py-5">
                <ul className="space-y-2.5">
                  {tier.perks.map((perk) => (
                    <li
                      key={perk}
                      className="flex items-start gap-2 text-sm text-neutral-600"
                    >
                      <Check
                        className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                          isFeatured ? "text-primary" : styles.check
                        }`}
                      />
                      {perk}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-center text-sm text-neutral-500">
        {t.contact}{" "}
        <a
          href="mailto:info@hemo-el-paso.org"
          className="text-primary font-semibold hover:underline"
        >
          info@hemo-el-paso.org
        </a>
      </p>
    </Section>
  );
}
