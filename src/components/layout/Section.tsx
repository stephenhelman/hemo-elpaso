import { cn } from "@/lib/utils";

interface SectionProps {
  children: React.ReactNode;
  className?: string;
  background?: "white" | "neutral" | "primary" | "dark";
  id?: string;
}

const backgrounds = {
  white: "bg-white",
  neutral: "bg-neutral-50",
  primary: "bg-primary-500",
  dark: "bg-neutral-900",
};

export default function Section({
  children,
  className,
  background = "neutral",
  id,
}: SectionProps) {
  return (
    <section id={id} className={cn(backgrounds[background], className)}>
      <div className="container-max section-padding">{children}</div>
    </section>
  );
}
