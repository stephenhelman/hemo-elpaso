"use client";

import AnimatedCounter from "@/components/ui/AnimatedCounter";

export function ImpactStatCard({
  value,
  suffix,
  label,
}: {
  value: number;
  suffix: string;
  label: string;
}) {
  return (
    <div className="text-center p-6 rounded-2xl bg-neutral-50 border border-neutral-100">
      <div className="font-display text-4xl lg:text-5xl font-bold text-primary mb-2">
        <AnimatedCounter end={value} suffix={suffix} />
      </div>
      <p className="text-sm font-medium text-neutral-500">{label}</p>
    </div>
  );
}
