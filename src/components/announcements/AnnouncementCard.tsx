"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, ChevronLeft, ChevronRight, ExternalLink, Megaphone, Pause, Play, X } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { pick } from "@/sanity/helpers/pick";
import { announcementTranslation } from "@/translation/announcements";
import {
  DISMISSED_STORAGE_KEY, addDismissed, parseDismissed, visibleAnnouncements, type PublicAnnouncement,
} from "@/lib/announcements/display";

export const ROTATE_MS = 8000;

/** True until the browser says motion is fine, so nothing moves before the preference is known. */
function useReducedMotion() {
  const [reduced, setReduced] = useState(true);
  useEffect(() => {
    const q = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(q.matches);
    update();
    q.addEventListener("change", update);
    return () => q.removeEventListener("change", update);
  }, []);
  return reduced;
}

const iconButton =
  "inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary";

/**
 * A small, non-blocking card in the corner that cycles through the live announcements. It never takes focus and never
 * covers the page with an overlay. It renders only after mount, so a dismissed announcement never flashes.
 */
export default function AnnouncementCard({ announcements }: { announcements: PublicAnnouncement[] }) {
  const { locale } = useLanguage();
  const pathname = usePathname() ?? "/";
  const reducedMotion = useReducedMotion();
  const [dismissed, setDismissed] = useState<string[] | null>(null); // null until the device has been read
  const [now, setNow] = useState(0);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const card = useRef<HTMLElement>(null);
  const [room, setRoom] = useState(0); // the tallest the card has been while showing

  useEffect(() => {
    let raw: string | null = null;
    try {
      raw = window.localStorage.getItem(DISMISSED_STORAGE_KEY);
    } catch {
      // storage blocked: dismissals last for this visit only
    }
    setDismissed(parseDismissed(raw));
  }, []);

  // The list came with the page and the layout is not re-fetched on navigation, so expiry is also checked here:
  // when the next one ends, on navigation, and when the tab comes back.
  useEffect(() => setNow(Date.now()), [pathname, announcements]);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const waits = announcements.map((a) => Date.parse(a.endsAt) - Date.now()).filter((ms) => ms > 0);
    const timer = window.setTimeout(tick, Math.min(60_000, ...waits) + 50);
    window.addEventListener("focus", tick);
    document.addEventListener("visibilitychange", tick);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("focus", tick);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [announcements, now]);

  const list = dismissed && now ? visibleAnnouncements(announcements, { pathname, dismissed, now }) : [];
  const total = list.length;
  const position = total ? index % total : 0;
  const current = list[position];
  const rotating = total > 1 && !reducedMotion && !paused && !hovered && !focused;

  useEffect(() => {
    if (!rotating) return;
    const timer = window.setTimeout(() => setIndex(position + 1), ROTATE_MS);
    return () => window.clearTimeout(timer);
  }, [rotating, position]);

  // A card that disappears never gets its "pointer left" or "focus left" events.
  useEffect(() => {
    if (total) return;
    setHovered(false);
    setFocused(false);
  }, [total]);

  const showing = !!current;
  useEffect(() => {
    const el = card.current;
    if (!el) return setRoom(0);
    const observer = new ResizeObserver(() => setRoom((h) => Math.max(h, el.offsetHeight)));
    observer.observe(el);
    return () => observer.disconnect();
  }, [showing]);

  if (!current) return null;

  const t = announcementTranslation[locale];
  const title = pick(current.title, locale) ?? "";
  const text = pick(current.text, locale);
  const label = pick(current.buttonLabel, locale) || t.learnMore;
  const linkClass = "mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary-600";

  const dismiss = () => {
    const next = addDismissed(dismissed ?? [], current.key);
    setDismissed(next);
    setIndex(position); // the following announcement moves into this place
    try {
      window.localStorage.setItem(DISMISSED_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // see above
    }
  };

  return (
    <>
      {/* Room below the footer, so at the bottom of a page the card never covers the footer's links. */}
      <div aria-hidden="true" data-announcement-room className="bg-neutral-900 print:hidden" style={{ height: room + 16 }} />
      <aside
        ref={card}
        aria-label={t.region}
        className="fixed inset-x-3 bottom-3 z-30 print:hidden sm:left-auto sm:right-4 sm:bottom-4 sm:w-96"
        onPointerEnter={(e) => e.pointerType === "mouse" && setHovered(true)}
        onPointerLeave={() => setHovered(false)}
        onFocus={() => setFocused(true)}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false);
        }}
      >
        <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-lg motion-safe:animate-in motion-safe:fade-in">
          <div className="flex items-start gap-3">
            <Megaphone className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" aria-hidden="true" />
            {/* Announced only when it is not moving by itself. */}
            <div className="min-w-0 flex-1" aria-live={rotating ? "off" : "polite"} aria-atomic="true">
              {current.organizer && <p className="mb-0.5 text-xs font-semibold text-neutral-500">{t.hostedBy(current.organizer)}</p>}
              <p className="font-display text-sm font-bold leading-snug text-neutral-900">{title}</p>
              {text && <p className="mt-1 line-clamp-3 text-sm text-neutral-600">{text}</p>}
              {current.external ? (
                <a href={current.href} target="_blank" rel="noopener noreferrer" className={linkClass}>
                  {label}
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                  <span className="sr-only">{t.newTab}</span>
                </a>
              ) : (
                <Link href={current.href} className={linkClass}>
                  {label}
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              )}
            </div>
            <button type="button" onClick={dismiss} className={`${iconButton} -mr-1 -mt-1`} aria-label={t.dismiss(title)}>
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          {total > 1 && (
            <div className="mt-2 flex items-center justify-end gap-1 border-t border-neutral-100 pt-2">
              {!reducedMotion && (
                <button type="button" onClick={() => setPaused((p) => !p)} className={`${iconButton} mr-auto`} aria-label={paused ? t.play : t.pause}>
                  {paused ? <Play className="h-4 w-4" aria-hidden="true" /> : <Pause className="h-4 w-4" aria-hidden="true" />}
                </button>
              )}
              <button type="button" onClick={() => setIndex(position + total - 1)} className={iconButton} aria-label={t.previous}>
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              </button>
              <span className="text-xs tabular-nums text-neutral-500">{t.position(position + 1, total)}</span>
              <button type="button" onClick={() => setIndex(position + 1)} className={iconButton} aria-label={t.next}>
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
