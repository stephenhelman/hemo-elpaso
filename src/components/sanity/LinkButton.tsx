"use client";

import Link from "next/link";
import type { Lang } from "@/types";
import { pick } from "@/sanity/helpers/pick";
import { iconFor } from "@/sanity/icons";
import type { LinkData } from "@/sanity/types";

const STYLES = {
  light: {
    primary: "bg-primary text-white hover:bg-primary-600",
    outline: "border-2 border-neutral-300 text-neutral-700 hover:border-primary hover:text-primary",
  },
  onPrimary: {
    primary: "bg-white text-primary hover:bg-primary-50",
    outline: "border-2 border-white/40 text-white hover:border-white",
  },
  dark: {
    primary: "bg-primary text-white hover:bg-primary-600",
    outline: "border-2 border-white/20 text-white hover:border-white/40 hover:bg-white/5",
  },
};

export function hrefFor(link: LinkData): string {
  switch (link.type) {
    case "phone":
      return `tel:${link.value}`;
    case "email":
      return `mailto:${link.value}`;
    default:
      return link.value;
  }
}

/** Renders a Sanity `link` as a pill button. `arrowRight` icons trail the label; other icons lead it. */
export default function LinkButton({
  link,
  style = "primary",
  icon,
  tone = "light",
  locale,
}: {
  link: LinkData;
  style?: string;
  icon?: string;
  tone?: keyof typeof STYLES;
  locale: Lang;
}) {
  const label = pick(link.label, locale);
  if (!label) return null;
  const Icon = iconFor(icon);
  // On a primary-coloured band the button is the compact white pill used by the home register band.
  const size = tone === "onPrimary" ? "px-8 py-3.5 font-bold text-sm" : "px-7 py-3.5 font-semibold";
  const cls = `inline-flex ${tone === "onPrimary" ? "" : "items-center gap-2 "}${size} rounded-full font-display transition-colors ${
    STYLES[tone][style === "outline" ? "outline" : "primary"]
  }`;
  const inner = (
    <>
      {Icon && icon !== "arrowRight" && <Icon className="w-4 h-4" />}
      {label}
      {Icon && icon === "arrowRight" && <Icon className="w-4 h-4" />}
    </>
  );
  const href = hrefFor(link);
  return link.type === "internal" ? (
    <Link href={href} className={cls}>{inner}</Link>
  ) : (
    <a href={href} className={cls} {...(link.type === "external" ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
      {inner}
    </a>
  );
}
