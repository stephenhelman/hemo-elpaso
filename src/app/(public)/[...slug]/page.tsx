import { notFound } from "next/navigation";

/**
 * Next 14 cannot render a custom app-level 404 when there are several root
 * layouts, so unmatched URLs are routed here and rendered by (public)/not-found.tsx
 * inside the site layout (bilingual, with the site's settings). Returns HTTP 404.
 */
export const dynamic = "force-dynamic";

export default function CatchAll() {
  notFound();
}
