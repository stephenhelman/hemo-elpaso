import type { StatColor } from "@/types";

export const STAT_COLORS: Record<StatColor, string> = {
  primary: "bg-primary-50 text-primary",
  secondary: "bg-secondary/10 text-secondary",
  accent: "bg-accent/10 text-accent-dark",
  blue: "bg-blue-100 text-blue-600",
  yellow: "bg-yellow-100 text-yellow-600",
  green: "bg-green-100 text-green-600",
  purple: "bg-purple-100 text-purple-600",
  amber: "bg-amber-100 text-amber-600",
  indigo: "bg-indigo-100 text-indigo-600",
  teal: "bg-teal-100 text-teal-600",
};

export const colorMap: Record<
  string,
  { bg: string; text: string; border: string; avatar: string }
> = {
  primary: {
    bg: "bg-primary-50",
    text: "text-primary-700",
    border: "border-primary-200",
    avatar: "bg-gradient-to-br from-primary-400 to-primary-600",
  },
  secondary: {
    bg: "bg-secondary/10",
    text: "text-secondary-700",
    border: "border-secondary/20",
    avatar: "bg-gradient-to-br from-secondary/70 to-secondary",
  },
  accent: {
    bg: "bg-accent/10",
    text: "text-accent-dark",
    border: "border-accent/20",
    avatar: "bg-gradient-to-br from-accent/70 to-accent",
  },
};

export const avatarColors: Record<string, string> = {
  primary: "bg-gradient-to-br from-primary-400 to-primary-600",
  secondary: "bg-gradient-to-br from-secondary/70 to-secondary",
  accent: "bg-gradient-to-br from-accent/70 to-accent",
};
