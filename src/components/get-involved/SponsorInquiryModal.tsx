"use client";

import { useState } from "react";
import { X, CheckCircle } from "lucide-react";
import { Lang } from "@/types";
import toast from "react-hot-toast";

interface Props {
  tier: string;
  locale: Lang;
  onClose: () => void;
}

const t = {
  en: {
    title: "Inquire About Sponsorship",
    sub: "Complete this form and our team will reach out within 1–2 business days.",
    contactName: "Contact Name",
    contactEmail: "Email Address",
    contactPhone: "Phone Number",
    companyName: "Company / Organization Name",
    website: "Website (optional)",
    tier: "Interested Tier",
    estimatedDonation: "Estimated Donation Amount",
    estimatedDonationPlaceholder: "e.g. $500, $1,000, open to discussion",
    message: "Message (optional)",
    messagePlaceholder: "Tell us about your company and sponsorship goals…",
    submit: "Submit Inquiry",
    submitting: "Submitting…",
    successHead: "Inquiry Received!",
    successBody: "Thank you for your interest in sponsoring HOEP. We'll be in touch shortly.",
    tierLabels: {
      platinum: "Platinum",
      gold: "Gold",
      silver: "Silver",
      bronze: "Bronze",
      custom: "Custom / Any Amount",
    } as Record<string, string>,
  },
  es: {
    title: "Consultar Sobre Patrocinio",
    sub: "Complete este formulario y nuestro equipo se comunicará en 1–2 días hábiles.",
    contactName: "Nombre de Contacto",
    contactEmail: "Correo Electrónico",
    contactPhone: "Número de Teléfono",
    companyName: "Nombre de Empresa / Organización",
    website: "Sitio Web (opcional)",
    tier: "Nivel de Interés",
    estimatedDonation: "Monto Estimado de Donación",
    estimatedDonationPlaceholder: "p. ej. $500, $1,000, abierto a discusión",
    message: "Mensaje (opcional)",
    messagePlaceholder: "Cuéntenos sobre su empresa y sus objetivos de patrocinio…",
    submit: "Enviar Consulta",
    submitting: "Enviando…",
    successHead: "¡Consulta Recibida!",
    successBody: "Gracias por su interés en patrocinar HOEP. Nos pondremos en contacto pronto.",
    tierLabels: {
      platinum: "Platino",
      gold: "Oro",
      silver: "Plata",
      bronze: "Bronce",
      custom: "Personalizado / Cualquier Monto",
    } as Record<string, string>,
  },
};

const inputClass =
  "w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-neutral-900 text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-colors bg-white";

export default function SponsorInquiryModal({ tier, locale, onClose }: Props) {
  const copy = t[locale];
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    companyName: "",
    website: "",
    estimatedDonation: "",
    message: "",
  });

  const tierLabel = copy.tierLabels[tier.toLowerCase()] ?? tier;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/sponsor-inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, interestedTier: tier }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Submission failed. Please try again.");
        return;
      }
      setSubmitted(true);
    } catch {
      toast.error("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-neutral-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="font-display font-bold text-neutral-900 text-lg">
            {copy.title}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-neutral-100 transition-colors"
          >
            <X className="w-5 h-5 text-neutral-500" />
          </button>
        </div>

        <div className="px-6 py-6">
          {submitted ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-secondary" />
              </div>
              <h3 className="font-display font-bold text-neutral-900 text-xl mb-2">
                {copy.successHead}
              </h3>
              <p className="text-neutral-500 text-sm max-w-xs mx-auto">
                {copy.successBody}
              </p>
              <button
                onClick={onClose}
                className="mt-6 px-6 py-2.5 rounded-full bg-primary text-white font-semibold text-sm hover:bg-primary-600 transition-colors"
              >
                Close
              </button>
            </div>
          ) : (
            <>
              <p className="text-neutral-500 text-sm mb-5">{copy.sub}</p>

              {/* Tier badge */}
              <div className="flex items-center gap-2 mb-5 p-3 bg-neutral-50 rounded-xl border border-neutral-200">
                <span className="text-sm text-neutral-500">{copy.tier}:</span>
                <span className="font-semibold text-primary text-sm">{tierLabel}</span>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                      {copy.contactName} <span className="text-primary">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={form.contactName}
                      onChange={(e) => setForm((p) => ({ ...p, contactName: e.target.value }))}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                      {copy.contactEmail} <span className="text-primary">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={form.contactEmail}
                      onChange={(e) => setForm((p) => ({ ...p, contactEmail: e.target.value }))}
                      className={inputClass}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                      {copy.contactPhone}
                    </label>
                    <input
                      type="tel"
                      value={form.contactPhone}
                      onChange={(e) => setForm((p) => ({ ...p, contactPhone: e.target.value }))}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                      {copy.companyName} <span className="text-primary">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={form.companyName}
                      onChange={(e) => setForm((p) => ({ ...p, companyName: e.target.value }))}
                      className={inputClass}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                    {copy.website}
                  </label>
                  <input
                    type="url"
                    value={form.website}
                    onChange={(e) => setForm((p) => ({ ...p, website: e.target.value }))}
                    placeholder="https://"
                    className={inputClass}
                  />
                </div>

                {/* Show estimatedDonation prominently for custom tier */}
                <div className={tier.toLowerCase() === "custom" ? "p-3 bg-primary-50 rounded-xl border border-primary-100" : ""}>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                    {copy.estimatedDonation}
                  </label>
                  <input
                    type="text"
                    value={form.estimatedDonation}
                    onChange={(e) => setForm((p) => ({ ...p, estimatedDonation: e.target.value }))}
                    placeholder={copy.estimatedDonationPlaceholder}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                    {copy.message}
                  </label>
                  <textarea
                    rows={3}
                    value={form.message}
                    onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
                    placeholder={copy.messagePlaceholder}
                    className={`${inputClass} resize-none`}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-full bg-primary text-white font-semibold text-sm hover:bg-primary-600 transition-colors disabled:opacity-60"
                >
                  {loading ? copy.submitting : copy.submit}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
