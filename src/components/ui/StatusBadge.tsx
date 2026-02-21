import { LucideIcon } from "lucide-react";

export interface StatusConfig {
  label: string;
  color: string;
  icon?: LucideIcon;
}

interface StatusBadgeProps {
  status: string;
  config: Record<string, StatusConfig>;
  showIcon?: boolean;
  fallback?: StatusConfig;
}

export default function StatusBadge({
  status,
  config,
  showIcon = false,
  fallback = { label: status, color: "bg-gray-100 text-gray-800" },
}: StatusBadgeProps) {
  const resolved = config[status] ?? fallback;
  const Icon = resolved.icon;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${resolved.color}`}
    >
      {showIcon && Icon && <Icon className="w-3 h-3" />}
      {resolved.label}
    </span>
  );
}
