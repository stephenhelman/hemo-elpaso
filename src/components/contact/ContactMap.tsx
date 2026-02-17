import { MapPin, ExternalLink } from "lucide-react";
import { Lang } from "@/types";

interface Props {
  lang: Lang;
}

const content = {
  en: {
    heading: "Find Us",
    sub: "Proudly serving El Paso and the surrounding border region since 1993.",
    directions: "Get Directions",
  },
  es: {
    heading: "Encuéntrenos",
    sub: "Sirviendo orgullosamente a El Paso y la región fronteriza desde 1993.",
    directions: "Obtener Direcciones",
  },
};

export default function ContactMap({ lang }: Props) {
  const t = content[lang];

  return (
    <div className="bg-white border-t border-neutral-100">
      <div className="container-max px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-8">
          <h2 className="font-display text-2xl font-bold text-neutral-900 mb-2">
            {t.heading}
          </h2>
          <p className="text-neutral-500">{t.sub}</p>
        </div>

        {/* Map embed */}
        <div className="relative rounded-2xl overflow-hidden border border-neutral-200 shadow-sm">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d215697.32506281038!2d-106.56989!3d31.7618778!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x86e75d90a0588239%3A0x4c0b18d0e4f02609!2sEl%20Paso%2C%20TX!5e0!3m2!1sen!2sus!4v1698000000000!5m2!1sen!2sus"
            width="100%"
            height="400"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="El Paso, Texas"
          />

          {/* Overlay card */}
          <div className="absolute bottom-4 left-4">
            <div className="bg-white rounded-xl shadow-lg p-4 flex items-start gap-3 max-w-xs">
              <div className="w-9 h-9 rounded-full bg-primary-50 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="font-display font-bold text-neutral-900 text-sm">
                  Hemophilia Outreach of El Paso
                </p>
                <p className="text-xs text-neutral-500">El Paso, Texas</p>
                <a
                  href="https://maps.google.com/?q=El+Paso+Texas"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary font-medium mt-1 hover:underline"
                >
                  {t.directions}
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
