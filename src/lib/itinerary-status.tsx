import { CheckCircle, Circle, X } from "lucide-react";

export type ItineraryStatus = "scheduled" | "current" | "completed" | "skipped";

interface StatusConfig {
  icon: React.ReactNode;
  textStyle: string;
  bgClass: string;
  borderClass: string;
}

export function getStatusConfig(status: ItineraryStatus): StatusConfig {
  const configs: Record<ItineraryStatus, StatusConfig> = {
    completed: {
      icon: <CheckCircle className="w-5 h-5 text-green-400" />,
      textStyle: "line-through opacity-60",
      bgClass: "bg-white/5",
      borderClass: "",
    },
    skipped: {
      icon: <X className="w-5 h-5 text-red-400" />,
      textStyle: "line-through opacity-60",
      bgClass: "bg-white/5",
      borderClass: "",
    },
    current: {
      icon: (
        <Circle className="w-5 h-5 text-primary-400 animate-pulse fill-primary-400" />
      ),
      textStyle: "font-bold",
      bgClass: "bg-primary-500/20",
      borderClass: "border border-primary-500/50",
    },
    scheduled: {
      icon: <Circle className="w-5 h-5 text-neutral-500" />,
      textStyle: "",
      bgClass: "bg-white/5",
      borderClass: "",
    },
  };

  return configs[status] || configs.scheduled;
}

export function shouldShowNextBadge(
  items: any[],
  currentIndex: number,
): boolean {
  // Show "Next" badge on first scheduled item
  const firstScheduledIndex = items.findIndex(
    (item) => item.status === "scheduled",
  );
  return currentIndex === firstScheduledIndex;
}

export function shouldShowNowBadge(status: ItineraryStatus): boolean {
  return status === "current";
}
