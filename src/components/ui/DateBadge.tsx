interface DateBadgeProps {
  date: Date;
  variant?: "primary" | "neutral";
  size?: "sm" | "md";
}

export default function DateBadge({
  date,
  variant = "neutral",
  size = "md",
}: DateBadgeProps) {
  const d = new Date(date);
  const month = d.toLocaleDateString("en-US", { month: "short" }).toUpperCase();
  const day = d.getDate();

  const sizeClasses = {
    sm: "w-12 h-12",
    md: "w-14 h-14",
  };

  const variantClasses = {
    primary: {
      wrapper: "bg-primary-50",
      month: "text-primary-600",
      day: "text-primary",
      daySize: size === "md" ? "text-2xl" : "text-xl",
    },
    neutral: {
      wrapper: "bg-neutral-100",
      month: "text-neutral-600",
      day: "text-neutral-900",
      daySize: size === "md" ? "text-xl" : "text-lg",
    },
  };

  const v = variantClasses[variant];

  return (
    <div
      className={`${sizeClasses[size]} rounded-xl ${v.wrapper} flex flex-col items-center justify-center flex-shrink-0`}
    >
      <span className={`text-xs font-semibold leading-none ${v.month}`}>
        {month}
      </span>
      <span className={`font-bold leading-none ${v.daySize} ${v.day}`}>
        {day}
      </span>
    </div>
  );
}
