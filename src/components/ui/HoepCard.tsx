import { cn } from "@/lib/utils";

interface CardProps {
  className?: string;
  children: React.ReactNode;
  hover?: boolean;
  padding?: "sm" | "md" | "lg" | "none";
}

const paddings = {
  none: "",
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

export default function HoepCard({
  className,
  children,
  hover,
  padding = "md",
}: CardProps) {
  return (
    <div
      className={cn(
        "bg-white rounded-2xl border border-neutral-200 shadow-sm",
        hover &&
          "hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer",
        paddings[padding],
        className,
      )}
    >
      {children}
    </div>
  );
}
