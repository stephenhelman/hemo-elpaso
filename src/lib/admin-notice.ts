import { sendLoggedEmail } from "@/lib/email/send";
import { emailDomain } from "@/lib/site";
import { officerAddresses } from "@/lib/email-routing/definitions";

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const wrap = (inner: string) => `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5;color:#222;max-width:560px">${inner}</div>`;

export interface AdminNotice { subjectEn: string; subjectEs: string; linesEn: string[]; linesEs: string[] }

/**
 * Every settings-account action (permissions, feature toggles, board role assignment) emails all four officer role
 * addresses. Same pattern as the email-routing notice. Bilingual in one message. Never throws; returns whether the
 * send was accepted. Contains no health information or family details.
 */
export async function notifyOfficersOfAdminAction(n: AdminNotice): Promise<boolean> {
  try {
    const html = wrap(
      n.linesEn.map((l) => `<p>${esc(l)}</p>`).join("") + "<hr/>" + n.linesEs.map((l) => `<p>${esc(l)}</p>`).join(""),
    );
    const res = await sendLoggedEmail({
      kind: "ADMIN_CHANGE_NOTICE", sender: "noreply", to: officerAddresses(emailDomain()),
      subject: `${n.subjectEn} / ${n.subjectEs}`, html,
    });
    return res.ok;
  } catch {
    return false;
  }
}
