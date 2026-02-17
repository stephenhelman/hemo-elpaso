import Section from "@/components/layout/Section";
import { ExternalLink } from "lucide-react";
import { Lang } from "@/types";

interface Props {
  lang: Lang;
}

const content = {
  en: {
    eyebrow: "National Support",
    heading: "National Organizations",
    sub: "These organizations provide research, advocacy, and resources for the bleeding disorders community nationwide.",
    orgs: [
      {
        abbr: "NHF",
        name: "National Hemophilia Foundation",
        body: "The leading national organization dedicated to finding better treatments and cures for bleeding and clotting disorders. Provides education, advocacy, and community support.",
        link: "https://www.hemophilia.org",
        color: "primary",
      },
      {
        abbr: "HFA",
        name: "Hemophilia Federation of America",
        body: "A patient advocacy organization that serves people with bleeding disorders and their families through education, outreach, and financial assistance programs.",
        link: "https://www.hemophiliafed.org",
        color: "secondary",
      },
      {
        abbr: "CDC",
        name: "CDC Bleeding Disorders",
        body: "The Centers for Disease Control and Prevention maintains the Universal Data Collection program and provides data, research, and public health resources for bleeding disorders.",
        link: "https://www.cdc.gov/ncbddd/hemophilia",
        color: "accent",
      },
      {
        abbr: "NBDF",
        name: "National Bleeding Disorders Foundation",
        body: "Formerly NHF — providing the bleeding disorders community with education, advocacy, research support, and connections to care across the United States.",
        link: "https://www.bleeding.org",
        color: "primary",
      },
    ],
  },
  es: {
    eyebrow: "Apoyo Nacional",
    heading: "Organizaciones Nacionales",
    sub: "Estas organizaciones brindan investigación, defensa y recursos para la comunidad de trastornos hemorrágicos a nivel nacional.",
    orgs: [
      {
        abbr: "NHF",
        name: "Fundación Nacional de Hemofilia",
        body: "La organización nacional líder dedicada a encontrar mejores tratamientos y curas para los trastornos hemorrágicos y de coagulación. Proporciona educación, defensa y apoyo comunitario.",
        link: "https://www.hemophilia.org",
        color: "primary",
      },
      {
        abbr: "HFA",
        name: "Federación de Hemofilia de América",
        body: "Una organización de defensa del paciente que sirve a personas con trastornos hemorrágicos y sus familias a través de educación, divulgación y programas de asistencia financiera.",
        link: "https://www.hemophiliafed.org",
        color: "secondary",
      },
      {
        abbr: "CDC",
        name: "CDC Trastornos Hemorrágicos",
        body: "Los Centros para el Control y la Prevención de Enfermedades mantienen el programa de Recopilación Universal de Datos y proporcionan datos, investigación y recursos de salud pública.",
        link: "https://www.cdc.gov/ncbddd/hemophilia",
        color: "accent",
      },
      {
        abbr: "NBDF",
        name: "Fundación Nacional de Trastornos Hemorrágicos",
        body: "Anteriormente NHF — proporcionando a la comunidad de trastornos hemorrágicos educación, defensa, apoyo a la investigación y conexiones con atención en todo Estados Unidos.",
        link: "https://www.bleeding.org",
        color: "primary",
      },
    ],
  },
};

const avatarColors: Record<string, string> = {
  primary: "bg-gradient-to-br from-primary-400 to-primary-600",
  secondary: "bg-gradient-to-br from-secondary/70 to-secondary",
  accent: "bg-gradient-to-br from-accent/70 to-accent",
};

export default function NationalOrgs({ lang }: Props) {
  const t = content[lang];

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
