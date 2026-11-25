"use client";

import { useEffect, useRef } from "react";
import Script from "next/script";

/* eslint-disable @typescript-eslint/no-explicit-any */
/** Cloudflare Turnstile (explicit render). `resetKey` changes -> the widget resets (after a failed submit). No site key = renders nothing (dev). */
export default function TurnstileWidget({ siteKey, onToken, resetKey = 0 }: { siteKey: string | null; onToken: (t: string) => void; resetKey?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const id = useRef<string | null>(null);
  const render = () => {
    const ts = (window as any).turnstile;
    if (!siteKey || !ts || !ref.current || id.current) return;
    id.current = ts.render(ref.current, { sitekey: siteKey, callback: (t: string) => onToken(t), "expired-callback": () => onToken("") });
  };
  useEffect(() => { render(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);
  useEffect(() => { if (resetKey) { (window as any).turnstile?.reset(id.current ?? undefined); onToken(""); } /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [resetKey]);
  if (!siteKey) return null;
  return (
    <>
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" strategy="afterInteractive" onReady={render} />
      <div ref={ref} />
    </>
  );
}
