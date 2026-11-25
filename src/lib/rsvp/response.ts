import { NextResponse } from "next/server";
import type { SubmitResult } from "./requests";

/** Maps a SubmitResult to the one JSON shape the modal, the family page and the RSVP page share. */
export function submitResponse(r: SubmitResult) {
  switch (r.kind) {
    case "rsvp": return NextResponse.json({ ok: true, outcome: "rsvp", checkInToken: r.token });
    case "already": return NextResponse.json({ ok: true, outcome: "already" });
    case "request": return NextResponse.json({ ok: true, outcome: "request", status: r.status, existing: r.existing });
    case "closed": return NextResponse.json({ ok: false, error: "closed" }, { status: 400 });
    case "by_invitation": return NextResponse.json({ ok: false, error: "invitation" }, { status: 403 });
    case "blocked": return NextResponse.json({ ok: false, error: "blocked" }, { status: 409 });
    default: return NextResponse.json({ ok: false, error: r.code === "FULL" ? "full" : r.code === "BAD_SELECTION" ? "invalid" : "server" }, { status: r.status });
  }
}

