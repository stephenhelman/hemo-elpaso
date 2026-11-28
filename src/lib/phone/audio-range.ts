/** HTTP Range for voicemail playback (Safari plays audio only if ranges work). PURE. */
export type ByteRange = { start: number; end: number } | "full" | "unsatisfiable";

export function parseRange(header: string | null, size: number): ByteRange {
  const m = /^bytes=(\d*)-(\d*)$/.exec(header?.trim() ?? "");
  if (!m || (!m[1] && !m[2])) return "full"; // none, unreadable, or several ranges: send the whole file
  if (!m[1]) {
    const last = Number(m[2]);
    return last === 0 || size === 0 ? "unsatisfiable" : { start: Math.max(0, size - last), end: size - 1 };
  }
  const start = Number(m[1]);
  if (m[2] && Number(m[2]) < start) return "full";
  if (start >= size) return "unsatisfiable";
  return { start, end: m[2] ? Math.min(Number(m[2]), size - 1) : size - 1 };
}

export function audioResponse(audio: Uint8Array, rangeHeader: string | null): Response {
  const size = audio.byteLength;
  const headers: Record<string, string> = {
    "Cache-Control": "private, no-store", "Accept-Ranges": "bytes", "X-Content-Type-Options": "nosniff", "Content-Type": "audio/mpeg",
    "Content-Disposition": "inline",
  };
  const range = parseRange(rangeHeader, size);
  if (range === "unsatisfiable") return new Response(null, { status: 416, headers: { ...headers, "Content-Range": `bytes */${size}` } });
  if (range === "full") return new Response(audio.slice(), { status: 200, headers: { ...headers, "Content-Length": String(size) } });
  const part = audio.slice(range.start, range.end + 1);
  return new Response(part, { status: 206, headers: { ...headers, "Content-Length": String(part.byteLength), "Content-Range": `bytes ${range.start}-${range.end}/${size}` } });
}
