import { Heart, Clock, DollarSign, Megaphone } from "lucide-react";

export const getInvolvedHeroTranslation = {
  en: {
    eyebrow: "Make a Difference",
    heading: "Get Involved With HOEP",
    sub: "Whether you volunteer your time, sponsor an event, or spread the word — every contribution helps us serve the El Paso bleeding disorders community.",
  },
  es: {
    eyebrow: "Haz una Diferencia",
    heading: "Participa con HOEP",
    sub: "Ya sea que done su tiempo, patrocine un evento o corra la voz — cada contribución nos ayuda a servir a la comunidad de trastornos hemorrágicos de El Paso.",
  },
};

export const waysToHelpTranslation = {
  en: {
    eyebrow: "How You Can Help",
    heading: "Ways to Get Involved",
    sub: "There are many ways to support HOEP and the El Paso bleeding disorders community.",
    ways: [
      {
        icon: Clock,
        title: "Volunteer Your Time",
        body: "Help us at events, assist with outreach, or share your professional skills. Every hour you give directly impacts a family in our community.",
        color: "primary",
        anchor: "/contact",
        cta: "Contact Us",
      },
      {
        icon: DollarSign,
        title: "Sponsor an Event",
        body: "Corporate and individual sponsorships fund our educational dinners, family workshops, and community programs. Contact us to talk about sponsoring an event.",
        color: "secondary",
        anchor: "/contact",
        cta: "Contact Us About Sponsoring",
      },
      {
        icon: Megaphone,
        title: "Spread the Word",
        body: "Share our events on social media, tell your network about HOEP, or help us reach families who may not know support is available.",
        color: "accent",
        anchor: "/contact",
        cta: "Contact Us",
      },
      {
        icon: Heart,
        title: "Join the Board",
        body: "We are currently welcoming new board members who want to help shape the future of HOEP. Bring your skills, passion, and time to our leadership team.",
        color: "primary",
        anchor: "/contact",
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
        icon: Clock,
        title: "Done su Tiempo",
        body: "Ayúdenos en eventos, asista con la divulgación o comparta sus habilidades profesionales. Cada hora que da impacta directamente a una familia en nuestra comunidad.",
        color: "primary",
        anchor: "/contact",
        cta: "Contáctenos",
      },
      {
        icon: DollarSign,
        title: "Patrocine un Evento",
        body: "Los patrocinios corporativos e individuales financian nuestras cenas educativas, talleres familiares y programas comunitarios. Contáctenos para hablar sobre patrocinar un evento.",
        color: "secondary",
        anchor: "/contact",
        cta: "Contáctenos Sobre Patrocinio",
      },
      {
        icon: Megaphone,
        title: "Corra la Voz",
        body: "Comparta nuestros eventos en las redes sociales, cuéntele a su red sobre HOEP o ayúdenos a llegar a familias que tal vez no sepan que hay apoyo disponible.",
        color: "accent",
        anchor: "/contact",
        cta: "Contáctenos",
      },
      {
        icon: Heart,
        title: "Únase a la Junta",
        body: "Actualmente damos la bienvenida a nuevos miembros de la junta que quieran ayudar a dar forma al futuro de HOEP. Aporte sus habilidades, pasión y tiempo a nuestro equipo de liderazgo.",
        color: "primary",
        anchor: "/contact",
        cta: "Expresar Interés",
      },
    ],
  },
};

export const sponsorshipTiersTranslation = {
  en: {
    eyebrow: "Sponsorship",
    heading: "Sponsorship Opportunities",
    sub: "Your sponsorship directly funds community programs, educational events, and family support services. All sponsors receive recognition at our events.",
    contact: "Interested in sponsoring? Contact us at",
    mostPopular: "★ Most Popular",
    inquireButton: "Inquire About This Tier",
    tiers: [
      {
        key: "bronze",
        name: "Bronze Sponsor",
        price: "$250+",
        color: "neutral",
        perks: [
          "Name listed in event programs",
          "Social media recognition",
          "Certificate of appreciation",
        ],
      },
      {
        key: "silver",
        name: "Silver Sponsor",
        price: "$500+",
        color: "secondary",
        featured: false,
        perks: [
          "Everything in Bronze",
          "Logo on event banners",
          "Table for 2 at educational dinner",
          "Quarterly newsletter feature",
        ],
      },
      {
        key: "gold",
        name: "Gold Sponsor",
        price: "$1,000+",
        color: "primary",
        featured: true,
        perks: [
          "Everything in Silver",
          "Table for 4 at educational dinner",
          "Speaking opportunity at event",
          "Logo on HOEP website",
          "Live engagement at sponsored event",
        ],
      },
      {
        key: "platinum",
        name: "Platinum Sponsor",
        price: "$2,500+",
        color: "accent",
        featured: false,
        perks: [
          "Everything in Gold",
          "Named event sponsorship",
          "Full table at Annual Gala",
          "Live sponsor dashboard & analytics",
          "Custom ROI report post-event",
          "First right of refusal next year",
        ],
      },
      {
        key: "custom",
        name: "Custom",
        price: "Any Amount",
        color: "neutral",
        featured: false,
        perks: [
          "Mom and pop shops, individuals, and businesses of all sizes are valued partners",
          "Recognition scaled to contribution",
          "Any amount welcome",
        ],
      },
    ],
  },
  es: {
    eyebrow: "Patrocinio",
    heading: "Oportunidades de Patrocinio",
    sub: "Su patrocinio financia directamente programas comunitarios, eventos educativos y servicios de apoyo familiar. Todos los patrocinadores reciben reconocimiento en nuestros eventos.",
    contact: "¿Interesado en patrocinar? Contáctenos en",
    mostPopular: "★ Más Popular",
    inquireButton: "Consultar Sobre Este Nivel",
    tiers: [
      {
        key: "bronze",
        name: "Patrocinador Bronce",
        price: "$250+",
        color: "neutral",
        perks: [
          "Nombre en los programas del evento",
          "Reconocimiento en redes sociales",
          "Certificado de agradecimiento",
        ],
      },
      {
        key: "silver",
        name: "Patrocinador Plata",
        price: "$500+",
        color: "secondary",
        featured: false,
        perks: [
          "Todo en Bronce",
          "Logo en pancartas del evento",
          "Mesa para 2 en cena educativa",
          "Mención en boletín trimestral",
        ],
      },
      {
        key: "gold",
        name: "Patrocinador Oro",
        price: "$1,000+",
        color: "primary",
        featured: true,
        perks: [
          "Todo en Plata",
          "Mesa para 4 en cena educativa",
          "Oportunidad de hablar en el evento",
          "Logo en el sitio web de HOEP",
          "Participación en vivo en el evento",
        ],
      },
      {
        key: "platinum",
        name: "Patrocinador Platino",
        price: "$2,500+",
        color: "accent",
        featured: false,
        perks: [
          "Todo en Oro",
          "Patrocinio de evento con nombre",
          "Mesa completa en Gala Anual",
          "Panel de patrocinador en vivo",
          "Informe de ROI personalizado",
          "Primer derecho de rechazo el próximo año",
        ],
      },
      {
        key: "custom",
        name: "Personalizado",
        price: "Cualquier Monto",
        color: "neutral",
        featured: false,
        perks: [
          "Pequeñas empresas, individuos y negocios de todos los tamaños son socios valorados",
          "Reconocimiento según contribución",
          "Cualquier monto es bienvenido",
        ],
      },
    ],
  },
};

export const getInvolvedCTATranslation = {
  en: {
    heading: "Ready to Make a Difference?",
    sub: "Every volunteer, every sponsor, and every advocate helps HOEP serve more families in the El Paso bleeding disorders community.",
    cta1: "Contact Us",
    cta2: "Contact Us",
  },
  es: {
    heading: "¿Listo para Hacer una Diferencia?",
    sub: "Cada voluntario, cada patrocinador y cada defensor ayuda a HOEP a servir a más familias en la comunidad de trastornos hemorrágicos de El Paso.",
    cta1: "Contáctenos",
    cta2: "Contáctenos",
  },
};
