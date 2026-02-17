import Section from "@/components/layout/Section";
import { Clock, DollarSign, Megaphone, Heart } from "lucide-react";
import { Lang } from "@/types";

interface Props {
  lang: Lang;
}

const content = {
  en: {
    eyebrow: "How You Can Help",
    heading: "Ways to Get Involved",
    sub: "There are many ways to support HOEP and the El Paso bleeding disorders community.",
    ways: [
      {
        icon: <Clock className="w-6 h-6" />,
        title: "Volunteer Your Time",
        body: "Help us at events, assist with outreach, or share your professional skills. Every hour you give directly impacts a family in our community.",
        color: "primary",
        anchor: "#volunteer",
        cta: "Sign Up to Volunteer",
      },
      {
        icon: <DollarSign className="w-6 h-6" />,
        title: "Sponsor an Event",
        body: "Corporate and individual sponsorships fund our educational dinners, family workshops, and community programs. See our sponsorship tiers below.",
        color: "secondary",
        anchor: "#sponsorship",
        cta: "View Sponsorship Tiers",
      },
      {
        icon: <Megaphone className="w-6 h-6" />,
        title: "Spread the Word",
        body: "Share our events on social media, tell your network about HOEP, or help us reach families who may not know support is available.",
        color: "accent",
        anchor: "/contact",
        cta: "Contact Us",
      },
      {
        icon: <Heart className="w-6 h-6" />,
        title: "Join the Board",
        body: "We are currently welcoming new board members who want to help shape the future of HOEP. Bring your skills, passion, and time to our leadership team.",
        color: "primary",
        anchor: "#volunteer",
        cta: "Express Interest",
      },
    ],
  },
  es: {
    eyebrow: "Cómo Puedes Ayudar",
    heading: "Formas de Participar",
    sub: "Hay muchas formas de apoyar a HOEP y a la comunidad de trastornos hemorrágicos de El Paso.",
    ways: [
      {
        icon: <Clock className="w-6 h-6" />,
        title: "Done su Tiempo",
        body: "Ayúdenos en eventos, asista con la divulgación o comparta sus habilidades profesionales. Cada hora que da impacta directamente a una familia en nuestra comunidad.",
        color: "primary",
        anchor: "#volunteer",
        cta: "Regístrese como Voluntario",
      },
      {
        icon: <DollarSign className="w-6 h-6" />,
        title: "Patrocine un Evento",
        body: "Los patrocinios corporativos e individuales financian nuestras cenas educativas, talleres familiares y programas comunitarios.",
        color: "secondary",
        anchor: "#sponsorship",
        cta: "Ver Niveles de Patrocinio",
      },
      {
        icon: <Megaphone className="w-6 h-6" />,
        title: "Corra la Voz",
        body: "Comparta nuestros eventos en las redes sociales, cuéntele a su red sobre HOEP o ayúdenos a llegar a familias que tal vez no sepan que hay apoyo disponible.",
        color: "accent",
        anchor: "/contact",
        cta: "Contáctenos",
      },
      {
        icon: <Heart className="w-6 h-6" />,
        title: "Únase a la Junta",
        body: "Actualmente damos la bienvenida a nuevos miembros de la junta que quieran ayudar a dar forma al futuro de HOEP.",
        color: "primary",
        anchor: "#volunteer",
        cta: "Expresar Interés",
      },
    ],
  },
};

const iconColors: Record<string, string> = {
  primary: "bg-primary-50 text-primary",
  secondary: "bg-secondary/10 text-secondary",
  accent: "bg-accent/10 text-accent-dark",
};

export default function WaysToHelp({ lang }: Props) {
  const t = content[lang];

  return (
    <Section background="neutral" id="ways">
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
        {t.ways.map((way) => (
          <WayCard key={way.title} way={way} />
        ))}
      </div>
    </Section>
  );
}

function WayCard({ way }: { way: (typeof content.en.ways)[0] }) {
  return (
    <div className="flex flex-col p-6 rounded-2xl bg-white border border-neutral-200 hover:border-primary-200 hover:shadow-md transition-all duration-200">
      <div
        className={`w-14 h-14 rounded-2xl ${iconColors[way.color]} flex items-center justify-center mb-4`}
      >
        {way.icon}
      </div>
      <h3 className="font-display font-bold text-neutral-900 text-lg mb-2">
        {way.title}
      </h3>
      <p className="text-neutral-500 text-sm leading-relaxed mb-5 flex-1">
        {way.body}
      </p>
      <a
        href={way.anchor}
        className="inline-flex items-center text-sm font-semibold text-primary hover:text-primary-600 transition-colors"
      >
        {way.cta} →
      </a>
    </div>
  );
}
