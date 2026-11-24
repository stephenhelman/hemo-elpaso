import { sendLoggedEmail } from "@/lib/email/send";
import { getRouteRecipients } from "@/lib/email-routing";
import { siteUrl } from "@/lib/site";

/**
 * Officer notice after a merge (routed like the duplicate sign-in notice: board.duplicates, President + VP by default).
 * A link only: no names, emails, addresses or household details. Never throws: a failed email must not undo a merge.
 */
export async function notifyMerged(keptId: string): Promise<void> {
  try {
    const link = `${siteUrl()}/admin/patients/${keptId}`;
    await sendLoggedEmail({
      kind: "RECORDS_MERGED_NOTICE",
      sender: "noreply",
      to: await getRouteRecipients("board.duplicates"),
      subject: "Two records were merged / Se fusionaron dos registros",
      html:
        `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5;color:#222;max-width:560px">` +
        `<p>An officer merged two records into one. The details are in the audit log. Open the merged record here: <a href="${link}">${link}</a></p><hr/>` +
        `<p>Un oficial fusionó dos registros en uno. Los detalles están en el registro de auditoría. Abra el registro aquí: <a href="${link}">${link}</a></p></div>`,
    });
  } catch {
    /* the merge already happened; the audit row is the record */
  }
}
