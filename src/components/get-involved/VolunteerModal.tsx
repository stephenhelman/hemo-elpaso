"use client";

import { useState } from "react";
import { X, CheckCircle, Heart } from "lucide-react";
import { Lang } from "@/types";
import toast from "react-hot-toast";

interface Props {
  locale: Lang;
  onClose: () => void;
}

const t = {
  en: {
    title: "Sign Up to Volunteer",
    sub: "Tell us about yourself and how you'd like to help.",
    name: "Full Name",
    email: "Email Address",
    phone: "Phone Number",
    areasLabel: "Areas of Interest",
    whyLabel: "Why do you want to volunteer?",
    whyPlaceholder: "Share your motivation…",
    availabilityLabel: "Availability",
    skillsLabel: "Relevant Skills (optional)",
    skillsPlaceholder: "Medical background, bilingual, event planning, etc.",
    bdLabel: "I or a family member has a bleeding disorder",
    submit: "Submit",
    submitting: "Submitting…",
    successHead: "Thank You!",
    successBody: "We received your volunteer inquiry and will be in touch within a few business days.",
    bdMessageHead: "You're connected to the bleeding disorder community!",
    bdMessageBody:
      "Since you or a family member has a bleeding disorder, we invite you to create a patient profile to access all HOEP resources. Would you like to join the community?",
    joinYes: "Yes, create my profile",
    joinNo: "No thanks, submit as community volunteer",
    areas: [
      { value: "event_support", label: "Event Support" },
      { value: "community_outreach", label: "Community Outreach" },
      { value: "admin_help", label: "Administrative Help" },
      { value: "board_membership", label: "Board Membership" },
      { value: "professional_skills", label: "Professional Skills" },
      { value: "other", label: "Other" },
    ],
    availabilities: [
      { value: "", label: "Select availability…" },
      { value: "weekdays", label: "Weekdays" },
      { value: "weekends", label: "Weekends" },
      { value: "events_only", label: "Events Only" },
      { value: "flexible", label: "Flexible" },
    ],
  },
  es: {
    title: "Regístrese como Voluntario",
    sub: "Cuéntenos sobre usted y cómo le gustaría ayudar.",
    name: "Nombre Completo",
    email: "Correo Electrónico",
    phone: "Número de Teléfono",
    areasLabel: "Áreas de Interés",
    whyLabel: "¿Por qué quiere ser voluntario/a?",
    whyPlaceholder: "Comparta su motivación…",
    availabilityLabel: "Disponibilidad",
    skillsLabel: "Habilidades Relevantes (opcional)",
    skillsPlaceholder: "Formación médica, bilingüe, organización de eventos, etc.",
    bdLabel: "Yo o un familiar tiene un trastorno hemorrágico",
    submit: "Enviar",
    submitting: "Enviando…",
    successHead: "¡Gracias!",
    successBody: "Recibimos su solicitud de voluntariado y nos pondremos en contacto en unos días hábiles.",
    bdMessageHead: "¡Está conectado/a con la comunidad de trastornos hemorrágicos!",
    bdMessageBody:
      "Como usted o un familiar tiene un trastorno hemorrágico, le invitamos a crear un perfil de paciente para acceder a todos los recursos de HOEP. ¿Le gustaría unirse a la comunidad?",
    joinYes: "Sí, crear mi perfil",
    joinNo: "No, enviar como voluntario comunitario",
    areas: [
      { value: "event_support", label: "Apoyo en Eventos" },
      { value: "community_outreach", label: "Divulgación Comunitaria" },
      { value: "admin_help", label: "Ayuda Administrativa" },
      { value: "board_membership", label: "Membresía de la Junta" },
      { value: "professional_skills", label: "Habilidades Profesionales" },
      { value: "other", label: "Otro" },
    ],
    availabilities: [
      { value: "", label: "Seleccione disponibilidad…" },
      { value: "weekdays", label: "Días de Semana" },
      { value: "weekends", label: "Fines de Semana" },
      { value: "events_only", label: "Solo Eventos" },
      { value: "flexible", label: "Flexible" },
    ],
  },
};

const inputClass =
  "w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-neutral-900 text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-colors bg-white";

type Step = "form" | "bd_prompt" | "success";

export default function VolunteerModal({ locale, onClose }: Props) {
  const copy = t[locale];
  const [step, setStep] = useState<Step>("form");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    areasOfInterest: [] as string[],
    whyVolunteer: "",
    availability: "",
    skills: "",
    hasBDConnection: false,
  });

  const toggleArea = (value: string) => {
    setForm((prev) => ({
      ...prev,
      areasOfInterest: prev.areasOfInterest.includes(value)
        ? prev.areasOfInterest.filter((a) => a !== value)
        : [...prev.areasOfInterest, value],
    }));
  };

  const submitToApi = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/volunteer-inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Submission failed. Please try again.");
        return;
      }
      setStep("success");
    } catch {
      toast.error("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.hasBDConnection) {
      // Show BD prompt before submitting
      setStep("bd_prompt");
    } else {
      await submitToApi();
    }
  };

  const handleJoinYes = () => {
    // Save form data to sessionStorage and redirect to auth login → register
    try {
      sessionStorage.setItem("volunteerFormData", JSON.stringify(form));
    } catch {
      // ignore storage errors
    }
    window.location.href = `/api/auth/login?returnTo=${encodeURIComponent("/register")}`;
  };

  const handleJoinNo = async () => {
    await submitToApi();
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
          {/* ── SUCCESS ── */}
          {step === "success" && (
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
          )}

          {/* ── BD PROMPT ── */}
          {step === "bd_prompt" && (
            <div className="py-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Heart className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-display font-bold text-neutral-900 text-base">
                  {copy.bdMessageHead}
                </h3>
              </div>
              <p className="text-neutral-600 text-sm leading-relaxed mb-6">
                {copy.bdMessageBody}
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleJoinYes}
                  className="flex-1 px-5 py-3 rounded-full bg-primary text-white font-semibold text-sm hover:bg-primary-600 transition-colors"
                >
                  {copy.joinYes}
                </button>
                <button
                  onClick={handleJoinNo}
                  disabled={loading}
                  className="flex-1 px-5 py-3 rounded-full border-2 border-neutral-300 text-neutral-700 font-semibold text-sm hover:border-neutral-400 transition-colors disabled:opacity-60"
                >
                  {loading ? copy.submitting : copy.joinNo}
                </button>
              </div>
            </div>
          )}

          {/* ── FORM ── */}
          {step === "form" && (
            <>
              <p className="text-neutral-500 text-sm mb-5">{copy.sub}</p>
              <form onSubmit={handleFormSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                      {copy.name} <span className="text-primary">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                      {copy.email} <span className="text-primary">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                      className={inputClass}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                      {copy.phone}
                    </label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                      {copy.availabilityLabel}
                    </label>
                    <select
                      value={form.availability}
                      onChange={(e) => setForm((p) => ({ ...p, availability: e.target.value }))}
                      className={inputClass}
                    >
                      {copy.availabilities.map((a) => (
                        <option key={a.value} value={a.value}>
                          {a.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Areas of Interest */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    {copy.areasLabel}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {copy.areas.map((area) => {
                      const checked = form.areasOfInterest.includes(area.value);
                      return (
                        <button
                          key={area.value}
                          type="button"
                          onClick={() => toggleArea(area.value)}
                          className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                            checked
                              ? "bg-primary text-white border-primary"
                              : "bg-white text-neutral-600 border-neutral-300 hover:border-primary-300"
                          }`}
                        >
                          {area.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                    {copy.whyLabel}
                  </label>
                  <textarea
                    rows={3}
                    value={form.whyVolunteer}
                    onChange={(e) => setForm((p) => ({ ...p, whyVolunteer: e.target.value }))}
                    placeholder={copy.whyPlaceholder}
                    className={`${inputClass} resize-none`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                    {copy.skillsLabel}
                  </label>
                  <input
                    type="text"
                    value={form.skills}
                    onChange={(e) => setForm((p) => ({ ...p, skills: e.target.value }))}
                    placeholder={copy.skillsPlaceholder}
                    className={inputClass}
                  />
                </div>

                {/* BD Connection */}
                <label className="flex items-start gap-3 p-3 rounded-xl border border-neutral-200 hover:border-primary-200 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={form.hasBDConnection}
                    onChange={(e) => setForm((p) => ({ ...p, hasBDConnection: e.target.checked }))}
                    className="mt-0.5 accent-primary"
                  />
                  <span className="text-sm text-neutral-700">{copy.bdLabel}</span>
                </label>

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
