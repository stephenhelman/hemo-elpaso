import { sendLoggedEmail } from "@/lib/email/send";
import { noticeText, type ChangeRecord } from "./change";
import { ROUTE_DEFS } from "./definitions";

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const wrap = (inner: string) => `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5;color:#222;max-width:560px">${inner}</div>`;

/** Email every officer role address that a route changed. Bilingual in one message (officers' languages are not known). */
export async function notifyOfficers(to: string[], rec: ChangeRecord): Promise<boolean> {
  const n = noticeText(rec);
  const html = wrap(
    `<p>${esc(n.lineEn)}</p>${n.policyEn ? `<p><strong>${esc(n.policyEn)}</strong></p>` : ""}<hr/>` +
      `<p>${esc(n.lineEs)}</p>${n.policyEs ? `<p><strong>${esc(n.policyEs)}</strong></p>` : ""}`,
  );
  const res = await sendLoggedEmail({ kind: "EMAIL_ROUTING_NOTICE", sender: "noreply", to, subject: `${n.subjectEn} / ${n.subjectEs}`, html });
  return res.ok;
}

/** The test email. Goes only to the route's own configured recipients. */
export async function sendRouteTest(route: keyof typeof ROUTE_DEFS, to: string[], sentBy: string) {
  const def = ROUTE_DEFS[route];
  const html = wrap(
    `<p><strong>[TEST]</strong> ${esc(def.label.en)} (${esc(route)})</p><p>This is a test of this email route, sent by ${esc(sentBy)}. If you received it, the route works. Nothing else is needed.</p><hr/>` +
      `<p><strong>[PRUEBA]</strong> ${esc(def.label.es)} (${esc(route)})</p><p>Esta es una prueba de esta ruta de correo, enviada por ${esc(sentBy)}. Si la recibió, la ruta funciona.</p>`,
  );
  return sendLoggedEmail({
    kind: "EMAIL_ROUTING_TEST",
    // Reply routes are tested from the sender whose replies they control; notification routes from the contact sender.
    sender: route === "reply.events" ? "events" : route === "reply.info" ? "info" : "contact",
    to,
    subject: `[TEST] ${def.label.en} / ${def.label.es}`,
    html,
  });
}
