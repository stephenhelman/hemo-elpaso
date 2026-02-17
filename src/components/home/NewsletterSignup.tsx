"use client";

import { useState } from "react";
import { Mail, CheckCircle } from "lucide-react";
import Section from "@/components/layout/Section";

interface NewsletterSignupProps {
  lang: "en" | "es";
}

const content = {
  en: {
    heading: "Stay in the Loop",
    sub: "Get notified about upcoming events, resources, and community news. No spam, ever.",
    placeholder: "Enter your email address",
    cta: "Subscribe",
    success: "You're subscribed! Welcome to the HOEP community.",
    privacy: "We respect your privacy. Unsubscribe at any time.",
  },
  es: {
    heading: "Mantente Informado",
    sub: "Recibe notificaciones sobre próximos eventos, recursos y noticias de la comunidad. Sin spam, nunca.",
    placeholder: "Ingresa tu correo electrónico",
    cta: "Suscribirse",
    success: "¡Estás suscrito! Bienvenido a la comunidad HOEP.",
    privacy:
      "Respetamos tu privacidad. Cancela la suscripción en cualquier momento.",
  },
};

export default function NewsletterSignup({ lang }: NewsletterSignupProps) {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const t = content[lang];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    // TODO: wire up to API route
    await new Promise((r) => setTimeout(r, 800));
    setSubmitted(true);
    setLoading(false);
  };

  return (
    <Section background="primary" id="newsletter">
      <div className="max-w-2xl mx-auto text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-white/10 mb-6">
          <Mail className="w-7 h-7 text-white" />
        </div>

        <h2 className="font-display text-3xl lg:text-4xl font-bold text-white mb-4">
          {t.heading}
        </h2>
        <p className="text-primary-100 mb-8 text-lg">{t.sub}</p>

        {submitted ? (
          <div className="flex items-center justify-center gap-3 text-white">
            <CheckCircle className="w-6 h-6" />
            <p className="font-medium">{t.success}</p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
          >
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t.placeholder}
              required
              className="flex-1 px-5 py-3.5 rounded-full bg-white/10 border border-white/20 text-white placeholder:text-primary-200 focus:outline-none focus:border-white/50 transition-colors text-sm"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-7 py-3.5 rounded-full bg-white text-primary font-display font-bold text-sm hover:bg-primary-50 transition-colors disabled:opacity-70 whitespace-nowrap"
            >
              {loading ? "..." : t.cta}
            </button>
          </form>
        )}

        <p className="text-primary-200 text-xs mt-4">{t.privacy}</p>
      </div>
    </Section>
  );
}
