import Section from "@/components/layout/Section";
import { ExternalLink, DollarSign, Shield, Phone } from "lucide-react";
import { Lang } from "@/types";

interface Props {
  lang: Lang;
}

const content = {
  en: {
    eyebrow: "Financial Assistance",
    heading: "Insurance & Financial Help",
    sub: "Navigating insurance and finances with a bleeding disorder can be overwhelming. These resources can help.",
    resources: [
      {
        icon: <DollarSign className="w-5 h-5" />,
        title: "HFA Patient Assistance",
        body: "The Hemophilia Federation of America offers financial assistance programs including help with insurance co-pays, travel costs, and emergency funds.",
        link: "https://www.hemophiliafed.org/programs-and-services/",
        cta: "View Programs",
      },
      {
        icon: <Shield className="w-5 h-5" />,
        title: "NHF Insurance Advocacy",
        body: "The National Hemophilia Foundation provides insurance advocacy resources, including guides for appealing denials and navigating Medicaid and Medicare.",
        link: "https://www.hemophilia.org/community-resources/insurance-and-financial-assistance",
        cta: "Get Help",
      },
      {
        icon: <Phone className="w-5 h-5" />,
        title: "Contact HOEP Directly",
        body: "Our team can connect you with local financial assistance resources and help navigate insurance challenges specific to the El Paso border region.",
        link: "/contact",
        cta: "Contact Us",
        internal: true,
      },
    ],
  },
  es: {
    eyebrow: "Asistencia Financiera",
    heading: "Seguro y Ayuda Financiera",
    sub: "Navegar por el seguro y las finanzas con un trastorno hemorrágico puede ser abrumador. Estos recursos pueden ayudar.",
    resources: [
      {
        icon: <DollarSign className="w-5 h-5" />,
        title: "Asistencia al Paciente HFA",
        body: "La Federación de Hemofilia de América ofrece programas de asistencia financiera que incluyen ayuda con copagos de seguro, costos de viaje y fondos de emergencia.",
        link: "https://www.hemophiliafed.org/programs-and-services/",
        cta: "Ver Programas",
      },
      {
        icon: <Shield className="w-5 h-5" />,
        title: "Defensa de Seguros NHF",
        body: "La Fundación Nacional de Hemofilia proporciona recursos de defensa de seguros, incluidas guías para apelar denegaciones y navegar por Medicaid y Medicare.",
        link: "https://www.hemophilia.org/community-resources/insurance-and-financial-assistance",
        cta: "Obtener Ayuda",
      },
      {
        icon: <Phone className="w-5 h-5" />,
        title: "Contacte a HOEP Directamente",
        body: "Nuestro equipo puede conectarle con recursos locales de asistencia financiera y ayudar a navegar los desafíos de seguro específicos de la región fronteriza de El Paso.",
        link: "/contact",
        cta: "Contáctenos",
        internal: true,
      },
    ],
  },
};

export default function InsuranceResources({ lang }: Props) {
  const t = content[lang];

  return (
    <Section background="neutral" id="financial">
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {t.resources.map((resource) => (
          <div
            key={resource.title}
            className="flex flex-col p-6 rounded-2xl bg-white border border-neutral-200 hover:border-primary-200 hover:shadow-md transition-all duration-200"
          >
            <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center text-primary mb-4">
              {resource.icon}
            </div>
            <h3 className="font-display font-bold text-neutral-900 mb-2">
              {resource.title}
            </h3>
            <p className="text-neutral-500 text-sm leading-relaxed mb-5 flex-1">
              {resource.body}
            </p>
            <a
              href={resource.link}
              target={resource.internal ? undefined : "_blank"}
              rel={resource.internal ? undefined : "noopener noreferrer"}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary-600 transition-colors"
            >
              {resource.cta}
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        ))}
      </div>
    </Section>
  );
}
