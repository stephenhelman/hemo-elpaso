export type AnnouncementPriority = "urgent" | "normal" | "info";

interface PriorityConfig {
  bg: string;
  border: string;
  text: string;
  icon: string;
}

export function getPriorityConfig(
  priority: AnnouncementPriority,
): PriorityConfig {
  const configs: Record<AnnouncementPriority, PriorityConfig> = {
    urgent: {
      bg: "bg-red-500",
      border: "border-red-600",
      text: "text-white",
      icon: "text-white",
    },
    normal: {
      bg: "bg-blue-500",
      border: "border-blue-600",
      text: "text-white",
      icon: "text-white",
    },
    info: {
      bg: "bg-neutral-700",
      border: "border-neutral-800",
      text: "text-white",
      icon: "text-white",
    },
  };

  return configs[priority] || configs.normal;
}
