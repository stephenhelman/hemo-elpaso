"use client";

import { useEffect, useState } from "react";

const GAP = 20; // px of clear space between the admin header and Studio's toolbar

/**
 * Holds the embedded Sanity Studio. It sits below whatever admin chrome is at the top of the window (the
 * sticky portal header and, on phones, the fixed admin bar: any element marked `data-admin-chrome`),
 * with a clear gap, and fills the rest of the viewport. The page itself is not allowed to scroll while the
 * Studio is open, so there is only ever Studio's own scrollbar (no double scrollbars).
 * Measured at run time, so it follows the real header heights instead of a guessed offset.
 */
export default function StudioFrame({ children }: { children: React.ReactNode }) {
  const [top, setTop] = useState<number | null>(null);

  useEffect(() => {
    const measure = () => {
      let bottom = 0;
      document.querySelectorAll<HTMLElement>("[data-admin-chrome]").forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.height > 0 && getComputedStyle(el).display !== "none") bottom = Math.max(bottom, r.bottom);
      });
      setTop(Math.round(bottom) + GAP);
    };
    measure();
    window.addEventListener("resize", measure);
    const ro = new ResizeObserver(measure);
    document.querySelectorAll("[data-admin-chrome]").forEach((el) => ro.observe(el));

    // No page scrollbar behind the Studio.
    const html = document.documentElement;
    const prev = { html: html.style.overflow, body: document.body.style.overflow };
    html.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("resize", measure);
      ro.disconnect();
      html.style.overflow = prev.html;
      document.body.style.overflow = prev.body;
    };
  }, []);

  return (
    <div
      // left: the 16rem admin sidebar on desktop. z-10 keeps it under the headers (z-50) and popovers above it.
      // NextStudio sizes itself to 100vh; the arbitrary variants below make its wrapper fill THIS frame instead.
      className="fixed inset-x-0 bottom-0 lg:left-64 z-10 bg-white overflow-hidden [&>div]:!h-full [&>div]:!max-h-full"
      style={{ top: top ?? 84 }}
    >
      {children}
    </div>
  );
}
