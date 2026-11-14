import "server-only";
import { client } from "./client";

/**
 * Cached, tag-based fetch. On ANY failure (missing token, network, empty result)
 * the error is logged and `fallback()` (today's dictionary copy) is returned, so
 * the public site never breaks because Sanity is unreachable.
 */
export async function sanityFetch<T>({
  query,
  params = {},
  tags,
  fallback,
}: {
  query: string;
  params?: Record<string, unknown>;
  tags: string[];
  fallback: () => T;
}): Promise<{ data: T; fromFallback: boolean }> {
  try {
    const data = await client.fetch<T | null>(query, params, {
      next: { tags, revalidate: 3600 }, // webhook revalidates by tag; 1h is the safety net
    });
    if (data == null) throw new Error("document not found (is it published? has the seed run?)");
    return { data, fromFallback: false };
  } catch (err) {
    console.error("[sanity] fetch failed, using dictionary fallback", {
      tags,
      message: (err as Error)?.message,
    });
    return { data: fallback(), fromFallback: true };
  }
}
