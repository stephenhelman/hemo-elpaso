import { LucideIcon } from "lucide-react";

interface InfoRowProps {
  icon: LucideIcon;
  children: React.ReactNode;
  iconClassName?: string;
  className?: string;
}

export default function InfoRow({
  icon: Icon,
  children,
  iconClassName = "w-4 h-4",
  className = "",
}: InfoRowProps) {
  return (
    <div className={`flex items-center gap-2 min-w-0 ${className}`}>
      <Icon className={`flex-shrink-0 ${iconClassName}`} />
      <span className="min-w-0">{children}</span>
    </div>
  );
}
