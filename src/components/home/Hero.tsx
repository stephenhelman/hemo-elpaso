"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Heart, Users } from "lucide-react";

interface HeroProps {
  lang: "en" | "es";
}

const content = {
  en: {
    eyebrow: "Hemophilia Outreach of El Paso",
    heading: "Giving Hope To Our Community",
    subheading:
      "Supporting individuals and families affected by bleeding disorders in the El Paso region. You are not alone.",
    cta1: "Get Involved",
    cta2: "Upcoming Events",
    badge1: "Free Support",
    badge2: "Community Driven",
  },
  es: {
    eyebrow: "Hemophilia Outreach de El Paso",
    heading: "Dando Esperanza A Nuestra Comunidad",
    subheading:
      "Apoyando a individuos y familias afectadas por trastornos hemorrágicos en la región de El Paso. No estás solo.",
    cta1: "Participa",
    cta2: "Próximos Eventos",
    badge1: "Apoyo Gratuito",
    badge2: "Impulsado por la Comunidad",
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay, ease: "easeOut" },
  }),
};

export default function Hero({ lang }: HeroProps) {
  const t = content[lang];

  return (
    <div className="relative min-h-[90vh] flex items-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 via-primary-900 to-neutral-900" />

      {/* Decorative circles */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-primary-500/10 -translate-y-1/2 translate-x-1/3" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-secondary/10 translate-y-1/2 -translate-x-1/3" />
      <div className="absolute top-1/2 left-1/2 w-[800px] h-[800px] rounded-full bg-primary-800/20 -translate-x-1/2 -translate-y-1/2" />

      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Content */}
      <div className="relative z-10 container-max px-4 sm:px-6 lg:px-8 py-24">
        <div className="max-w-3xl">
          {/* Eyebrow */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0}
            className="flex items-center gap-2 mb-6"
          >
            <div className="w-8 h-0.5 bg-primary-400" />
            <span className="text-primary-400 text-sm font-semibold tracking-widest uppercase">
              {t.eyebrow}
            </span>
          </motion.div>

          {/* Heading */}
          <motion.h1
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0.15}
            className="font-display text-4xl sm:text-4xl md:text-4xl lg:text-5xl  xl:text-5xl font-bold text-white leading-[1.4] tracking-tight mb-6"
          >
            {t.heading.split(" ").map((word, i) => (
              <span
                key={i}
                className={
                  word === "Hope" || word === "Esperanza"
                    ? "text-primary-400"
                    : ""
                }
              >
                {word}{" "}
              </span>
            ))}
          </motion.h1>

          {/* Subheading */}
          <motion.p
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0.3}
            className="text-lg text-neutral-300 leading-relaxed mb-10 max-w-xl"
          >
            {t.subheading}
          </motion.p>

          {/* CTAs */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0.45}
            className="flex flex-wrap gap-4 mb-12"
          >
            <Link
              href="/get-involved"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-primary text-white font-display font-semibold hover:bg-primary-600 transition-all duration-200 shadow-lg shadow-primary/30 group"
            >
              {t.cta1}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/events"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full border-2 border-white/20 text-white font-display font-semibold hover:border-white/40 hover:bg-white/5 transition-all duration-200"
            >
              {t.cta2}
            </Link>
          </motion.div>

          {/* Badges */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0.6}
            className="flex flex-wrap gap-3"
          >
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/10 backdrop-blur-sm">
              <Heart className="w-4 h-4 text-primary-400 fill-primary-400" />
              <span className="text-sm text-white font-medium">{t.badge1}</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/10 backdrop-blur-sm">
              <Users className="w-4 h-4 text-secondary" />
              <span className="text-sm text-white font-medium">{t.badge2}</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-neutral-50 to-transparent" />
    </div>
  );
}
