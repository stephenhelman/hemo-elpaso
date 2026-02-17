import Section from "@/components/layout/Section";
import HoepCard from "@/components/ui/HoepCard";
import { Target, Heart, Users, BookOpen, Star, Globe } from "lucide-react";

interface Props {
  lang: "en" | "es";
}

const content = {
  en: {
    missionEyebrow: "Who We Are",
    missionHeading: "Mission, Purpose & Values",
    mission: {
      icon: "🎯",
      title: "Our Mission",
      body: "To offer support to individuals and their families affected by hemophilia, Von Willebrand disease, and other genetic blood disorders — fostering participation so that treatment becomes more effective, quality of life improves, and personal and social involvement within the community increases.",
    },
    objective: {
      icon: "⭐",
      title: "Our Objective",
      body: "To ensure that each member of our group may equally obtain information, support, education, kindness, respect, and courtesy. Each new family that joins us will be received with a warm welcome, regardless of economic status, religion, gender, personal beliefs, nationality, or race.",
    },
    goal: {
      icon: "🏆",
      title: "Our Goal",
      body: "To obtain and make available to our members the most up-to-date information on hemophilia, Von Willebrand disease, and other genetic blood disorders — including treatment options, specialized care, health and fitness, and educational activities.",
    },
    valuesHeading: "What We Do",
    values: [
      {
        icon: <BookOpen className="w-6 h-6" />,
        title: "Education",
        body: "Providing up-to-date educational guidance on bleeding disorders, treatments, and resources.",
      },
      {
        icon: <Heart className="w-6 h-6" />,
        title: "Family Support",
        body: "Standing beside every family with compassion, resources, and a welcoming community.",
      },
      {
        icon: <Users className="w-6 h-6" />,
        title: "Community Events",
        body: "Organizing events that bring our community together, foster connection, and celebrate progress.",
      },
      {
        icon: <Globe className="w-6 h-6" />,
        title: "Advocacy",
        body: "Advocating for the rights and needs of the bleeding disorders community in El Paso and beyond.",
      },
    ],
  },
  es: {
    missionEyebrow: "Quiénes Somos",
    missionHeading: "Misión, Propósito y Valores",
    mission: {
      icon: "🎯",
      title: "Nuestra Misión",
      body: "Ofrecer apoyo a individuos y sus familias afectadas por hemofilia, enfermedad de Von Willebrand y otros trastornos genéticos de la sangre — fomentando la participación para que el tratamiento sea más efectivo, mejore la calidad de vida y aumente la participación personal y social dentro de la comunidad.",
    },
    objective: {
      icon: "⭐",
      title: "Nuestro Objetivo",
      body: "Asegurar que cada miembro de nuestro grupo pueda obtener igualmente información, apoyo, educación, amabilidad, respeto y cortesía. Cada nueva familia que se une a nosotros será recibida con una cálida bienvenida, independientemente de su estado económico, religión, género, creencias personales, nacionalidad o raza.",
    },
    goal: {
      icon: "🏆",
      title: "Nuestra Meta",
      body: "Obtener y poner a disposición de nuestros miembros la información más actualizada sobre hemofilia, enfermedad de Von Willebrand y otros trastornos genéticos de la sangre — incluyendo opciones de tratamiento, atención especializada, salud y fitness, y actividades educativas.",
    },
    valuesHeading: "Lo Que Hacemos",
    values: [
      {
        icon: <BookOpen className="w-6 h-6" />,
        title: "Educación",
        body: "Proporcionando orientación educativa actualizada sobre trastornos hemorrágicos, tratamientos y recursos.",
      },
      {
        icon: <Heart className="w-6 h-6" />,
        title: "Apoyo Familiar",
        body: "Apoyando a cada familia con compasión, recursos y una comunidad acogedora.",
      },
      {
        icon: <Users className="w-6 h-6" />,
        title: "Eventos Comunitarios",
        body: "Organizando eventos que unen a nuestra comunidad, fomentan la conexión y celebran el progreso.",
      },
      {
        icon: <Globe className="w-6 h-6" />,
        title: "Defensa",
        body: "Defendiendo los derechos y necesidades de la comunidad de trastornos hemorrágicos en El Paso y más allá.",
      },
    ],
  },
};

export default function MissionValues({ lang }: Props) {
  const t = content[lang];

  return (
    <Section background="neutral">
      {/* Mission / Objective / Goal */}
      <div className="text-center mb-12">
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="w-8 h-0.5 bg-primary-400" />
          <span className="text-primary-500 text-sm font-semibold tracking-widest uppercase">
            {t.missionEyebrow}
          </span>
          <div className="w-8 h-0.5 bg-primary-400" />
        </div>
        <h2 className="font-display text-3xl font-bold text-neutral-900">
          {t.missionHeading}
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
        {[t.mission, t.objective, t.goal].map((item) => (
          <HoepCard key={item.title} className="text-center">
            <div className="text-4xl mb-4">{item.icon}</div>
            <h3 className="font-display font-bold text-neutral-900 text-lg mb-3">
              {item.title}
            </h3>
            <p className="text-neutral-500 text-sm leading-relaxed">
              {item.body}
            </p>
          </HoepCard>
        ))}
      </div>

      {/* Values */}
      <div className="text-center mb-12">
        <h2 className="font-display text-3xl font-bold text-neutral-900">
          {t.valuesHeading}
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {t.values.map((value) => (
          <ValueCard key={value.title} {...value} />
        ))}
      </div>
    </Section>
  );
}

function ValueCard({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-white border border-neutral-200 hover:border-primary-200 hover:shadow-md transition-all duration-200">
      <div className="w-14 h-14 rounded-full bg-primary-50 flex items-center justify-center text-primary mb-4">
        {icon}
      </div>
      <h3 className="font-display font-bold text-neutral-900 mb-2">{title}</h3>
      <p className="text-sm text-neutral-500 leading-relaxed">{body}</p>
    </div>
  );
}
