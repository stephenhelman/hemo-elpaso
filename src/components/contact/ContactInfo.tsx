import { Phone, Mail, MapPin, Facebook, Clock } from "lucide-react";
import HoepCard from "@/components/ui/HoepCard";
import { Lang } from "@/types";

interface Props {
  lang: Lang;
}

const content = {
  en: {
    heading: "Contact Information",
    phone: "Phone",
    email: "Email",
    address: "Location",
    hours: "Office Hours",
    social: "Follow Us",
    hoursVal: "Monday – Friday, 9:00 AM – 5:00 PM",
    addrVal: "El Paso, Texas",
    note: "We serve the greater El Paso and surrounding border region.",
  },
  es: {
    heading: "Información de Contacto",
    phone: "Teléfono",
    email: "Correo Electrónico",
    address: "Ubicación",
    hours: "Horario de Oficina",
    social: "Síguenos",
    hoursVal: "Lunes – Viernes, 9:00 AM – 5:00 PM",
    addrVal: "El Paso, Texas",
    note: "Servimos a El Paso y la región fronteriza.",
  },
};

export default function ContactInfo({ lang }: Props) {
  const t = content[lang];

  return (
    <div className="space-y-4">
      <HoepCard>
        <h2 className="font-display font-bold text-neutral-900 mb-5">
          {t.heading}
        </h2>
        <div className="space-y-5">
          <InfoRow
            icon={<Phone className="w-4 h-4" />}
            label={t.phone}
            value="(915) 621-8291"
            href="tel:+19156218291"
          />
          <InfoRow
            icon={<Mail className="w-4 h-4" />}
            label={t.email}
            value="info@hemo-el-paso.org"
            href="mailto:info@hemo-el-paso.org"
          />
          <InfoRow
            icon={<MapPin className="w-4 h-4" />}
            label={t.address}
            value={t.addrVal}
          />
          <InfoRow
            icon={<Clock className="w-4 h-4" />}
            label={t.hours}
            value={t.hoursVal}
          />
        </div>
      </HoepCard>

      {/* Social */}
      <HoepCard>
        <h3 className="font-display font-bold text-neutral-900 mb-4 text-sm">
          {t.social}
        </h3>
        <a
          href="https://facebook.com/hemoelpaso"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 p-3 rounded-xl hover:bg-neutral-50 transition-colors group"
        >
          <div className="w-9 h-9 rounded-full bg-[#1877F2]/10 flex items-center justify-center flex-shrink-0">
            <Facebook className="w-4 h-4 text-[#1877F2]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-neutral-900 group-hover:text-primary transition-colors">
              Facebook
            </p>
            <p className="text-xs text-neutral-400">@hemoelpaso</p>
          </div>
        </a>
      </HoepCard>

      {/* Note */}
      <p className="text-xs text-neutral-400 text-center px-2">{t.note}</p>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  href?: string;
}) {
  return (
    <div className="flex gap-3">
      <span className="text-primary-500 flex-shrink-0 mt-0.5">{icon}</span>
      <div>
        <p className="text-xs text-neutral-400 font-medium uppercase tracking-wide mb-0.5">
          {label}
        </p>
        {href ? (
          <a
            href={href}
            className="text-sm text-neutral-700 hover:text-primary transition-colors font-medium"
          >
            {value}
          </a>
        ) : (
          <p className="text-sm text-neutral-700">{value}</p>
        )}
      </div>
    </div>
  );
}
