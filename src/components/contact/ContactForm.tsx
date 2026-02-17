"use client";

import { useState } from "react";
import { Send, CheckCircle } from "lucide-react";
import HoepCard from "@/components/ui/HoepCard";
import { Lang } from "@/types";

interface Props {
  lang: Lang;
}

const content = {
  en: {
    heading: "Send Us a Message",
    sub: "Fill out the form below and we'll get back to you within 1-2 business days.",
    name: "Full Name",
    email: "Email Address",
    phone: "Phone Number (optional)",
    subject: "Subject",
    message: "Message",
    reason: "Reason for Contact",
    submit: "Send Message",
    sending: "Sending...",
    successHead: "Message Sent!",
    successBody:
      "Thank you for reaching out. We'll be in touch within 1-2 business days.",
    reasons: [
      { value: "", label: "Select a reason..." },
      { value: "general", label: "General Inquiry" },
      { value: "family", label: "Family / Patient Support" },
      { value: "volunteer", label: "Volunteering" },
      { value: "sponsor", label: "Sponsorship" },
      { value: "media", label: "Media / Press" },
      { value: "other", label: "Other" },
    ],
  },
  es: {
    heading: "Envíenos un Mensaje",
    sub: "Complete el formulario y nos pondremos en contacto en 1-2 días hábiles.",
    name: "Nombre Completo",
    email: "Correo Electrónico",
    phone: "Número de Teléfono (opcional)",
    subject: "Asunto",
    message: "Mensaje",
    reason: "Motivo de Contacto",
    submit: "Enviar Mensaje",
    sending: "Enviando...",
    successHead: "¡Mensaje Enviado!",
    successBody:
      "Gracias por comunicarse. Nos pondremos en contacto en 1-2 días hábiles.",
    reasons: [
      { value: "", label: "Seleccione un motivo..." },
      { value: "general", label: "Consulta General" },
      { value: "family", label: "Apoyo Familiar / Paciente" },
      { value: "volunteer", label: "Voluntariado" },
      { value: "sponsor", label: "Patrocinio" },
      { value: "media", label: "Medios / Prensa" },
      { value: "other", label: "Otro" },
    ],
  },
};

export default function ContactForm({ lang }: Props) {
  const t = content[lang];

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    reason: "",
    message: "",
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // TODO: wire to API route + Resend
    await new Promise((r) => setTimeout(r, 1000));
    setSubmitted(true);
    setLoading(false);
  };

  if (submitted) {
    return (
      <HoepCard className="flex flex-col items-center justify-center text-center py-16">
        <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center mb-4">
          <CheckCircle className="w-8 h-8 text-secondary" />
        </div>
        <h2 className="font-display font-bold text-neutral-900 text-2xl mb-2">
          {t.successHead}
        </h2>
        <p className="text-neutral-500 max-w-sm">{t.successBody}</p>
      </HoepCard>
    );
  }

  return (
    <HoepCard>
      <h2 className="font-display font-bold text-neutral-900 text-xl mb-1">
        {t.heading}
      </h2>
      <p className="text-neutral-500 text-sm mb-6">{t.sub}</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name + Email */}
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

        {/* Phone + Reason */}
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
          <FormField label={t.reason} required>
            <select
              name="reason"
              required
              value={form.reason}
              onChange={handleChange}
              className={inputClass}
            >
              {t.reasons.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </FormField>
        </div>

        {/* Message */}
        <FormField label={t.message} required>
          <textarea
            name="message"
            required
            rows={5}
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
          <Send className="w-4 h-4" />
          {loading ? t.sending : t.submit}
        </button>
      </form>
    </HoepCard>
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

const inputClass = `
  w-full px-4 py-2.5 rounded-xl border border-neutral-200
  text-neutral-900 text-sm placeholder:text-neutral-400
  focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400
  transition-colors bg-white
`.trim();
