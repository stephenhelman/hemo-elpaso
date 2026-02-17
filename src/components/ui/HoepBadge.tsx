import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "accent" | "neutral";
  className?: string;
}

const variants = {
  primary: "bg-primary-50 text-primary-700 border-primary-200",
  secondary: "bg-secondary/10 text-secondary-700 border-secondary/20",
  accent: "bg-accent/10 text-accent-dark border-accent/20",
  neutral: "bg-neutral-100 text-neutral-600 border-neutral-200",
};

export default function HoepBadge({
  children,
  variant = "primary",
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border",
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
