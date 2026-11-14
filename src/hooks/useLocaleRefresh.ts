"use client";

import { useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";

/**
 * Re-render server components after a locale change without a reload.
 * The current page stays visible until the new render arrives, and the scroll
 * position is restored afterwards (Next resets it to the top on refresh).
 */
export function useLocaleRefresh() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const savedY = useRef<number | null>(null);

  const refresh = () => {
    savedY.current = window.scrollY;
    startTransition(() => router.refresh());
  };

  useEffect(() => {
    if (isPending || savedY.current === null) return;
    const y = savedY.current;
    savedY.current = null;
    window.scrollTo({ top: y, left: 0, behavior: "instant" as ScrollBehavior });
    // Next may apply its own scroll a frame after commit; restore again.
    requestAnimationFrame(() => window.scrollTo({ top: y, left: 0, behavior: "instant" as ScrollBehavior }));
  }, [isPending]);

  return { refresh, isPending };
}
