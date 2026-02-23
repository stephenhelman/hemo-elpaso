"use client";

import { useState } from "react";
import { CheckCircle } from "lucide-react";
import HoepCard from "@/components/ui/HoepCard";
import Section from "@/components/layout/Section";
import { useLanguage } from "@/context/LanguageContext";

const content = {
  en: {
    eyebrow: "Volunteer",
    heading: "Sign Up to Volunteer",
    sub: "Tell us a little about yourself and how you'd like to help. We'll be in touch within a few days.",
    name: "Full Name",
    email: "Email Address",
    phone: "Phone Number",
    interest: "Area of Interest",
    availability: "Availability",
    message: "Anything else you'd like us to know?",
    submit: "Submit Volunteer Interest",
    sending: "Submitting...",
    successHead: "Thank You!",
    successBody:
      "We've received your volunteer interest form. Someone from HOEP will reach out within a few days.",
    interests: [
      { value: "", label: "Select an area..." },
      { value: "events", label: "Event Support" },
      { value: "outreach", label: "Community Outreach" },
      { value: "admin", label: "Administrative Help" },
      { value: "board", label: "Board Membership" },
      {
        value: "professional",
        label: "Professional Skills (Medical, Legal, etc.)",
      },
      { value: "other", label: "Other" },
    ],
    availabilities: [
      { value: "", label: "Select availability..." },
      { value: "weekdays", label: "Weekdays" },
      { value: "weekends", label: "Weekends" },
      { value: "events", label: "Events Only" },
      { value: "flexible", label: "Flexible" },
    ],
  },
  es: {
    eyebrow: "Voluntariado",
    heading: "Regístrese como Voluntario",
    sub: "Cuéntenos un poco sobre usted y cómo le gustaría ayudar. Nos pondremos en contacto en unos días.",
    name: "Nombre Completo",
    email: "Correo Electrónico",
    phone: "Número de Teléfono",
    interest: "Área de Interés",
    availability: "Disponibilidad",
    message: "¿Algo más que quiera que sepamos?",
    submit: "Enviar Interés de Voluntario",
    sending: "Enviando...",
    successHead: "¡Gracias!",
    successBody:
      "Hemos recibido su formulario de interés de voluntario. Alguien de HOEP se comunicará en unos días.",
    interests: [
      { value: "", label: "Seleccione un área..." },
      { value: "events", label: "Apoyo en Eventos" },
      { value: "outreach", label: "Divulgación Comunitaria" },
      { value: "admin", label: "Ayuda Administrativa" },
      { value: "board", label: "Membresía de la Junta" },
      { value: "professional", label: "Habilidades Profesionales" },
      { value: "other", label: "Otro" },
    ],
    availabilities: [
      { value: "", label: "Seleccione disponibilidad..." },
      { value: "weekdays", label: "Días de Semana" },
      { value: "weekends", label: "Fines de Semana" },
      { value: "events", label: "Solo Eventos" },
      { value: "flexible", label: "Flexible" },
    ],
  },
};

const inputClass = `
  w-full px-4 py-2.5 rounded-xl border border-neutral-200
  text-neutral-900 text-sm placeholder:text-neutral-400
  focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400
  transition-colors bg-white
`.trim();

export default function VolunteerForm() {
  const { locale } = useLanguage();
  const t = content[locale];
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    interest: "",
    availability: "",
    message: "",
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // TODO: wire to API route
    await new Promise((r) => setTimeout(r, 1000));
    setSubmitted(true);
    setLoading(false);
  };

  return (
    <Section background="white" id="volunteer">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
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
          <p className="text-neutral-500">{t.sub}</p>
        </div>

        {submitted ? (
          <HoepCard className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-secondary" />
            </div>
            <h3 className="font-display font-bold text-neutral-900 text-2xl mb-2">
              {t.successHead}
            </h3>
            <p className="text-neutral-500 max-w-sm mx-auto">{t.successBody}</p>
          </HoepCard>
        ) : (
          <HoepCard>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label={t.name} required>
                  <input
                    name="name"
                    type="text"
                    required
                    value={form.name}
                    onChange={handleChange}
                    placeholder={t.name}
                    className={inputClass}
                  />
                </FormField>
                <FormField label={t.email} required>
                  <input
                    name="email"
                    type="email"
                    required
                    value={form.email}
                    onChange={handleChange}
                    placeholder={t.email}
                    className={inputClass}
                  />
                </FormField>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label={t.phone}>
                  <input
                    name="phone"
                    type="tel"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder={t.phone}
                    className={inputClass}
                  />
                </FormField>
                <FormField label={t.availability} required>
                  <select
                    name="availability"
                    required
                    value={form.availability}
                    onChange={handleChange}
                    className={inputClass}
                  >
                    {t.availabilities.map((a) => (
                      <option key={a.value} value={a.value}>
                        {a.label}
                      </option>
                    ))}
                  </select>
                </FormField>
              </div>

              <FormField label={t.interest} required>
                <select
                  name="interest"
                  required
                  value={form.interest}
                  onChange={handleChange}
                  className={inputClass}
                >
                  {t.interests.map((i) => (
                    <option key={i.value} value={i.value}>
                      {i.label}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label={t.message}>
                <textarea
                  name="message"
                  rows={4}
                  value={form.message}
                  onChange={handleChange}
                  placeholder={t.message}
                  className={`${inputClass} resize-none`}
                />
              </FormField>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-primary text-white font-display font-semibold hover:bg-primary-600 transition-colors disabled:opacity-70"
              >
                {loading ? t.sending : t.submit}
              </button>
            </form>
          </HoepCard>
        )}
      </div>
    </Section>
  );
}

function FormField({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-neutral-700">
        {label}
        {required && <span className="text-primary ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}
