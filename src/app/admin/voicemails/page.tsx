import { redirect } from "next/navigation";
import { getAdminWithPermissions } from "@/lib/permissions";
import { getLocaleCookie } from "@/lib/locale";
import { voicemailView } from "@/lib/phone/voicemail-board";
import VoicemailsClient from "./VoicemailsClient";
import type { Lang } from "@/types";

export const dynamic = "force-dynamic";

export default async function VoicemailsPage() {
  const admin = await getAdminWithPermissions();
  if (!admin) redirect("/");
  if (!admin.can("canListenVoicemail")) redirect("/admin/dashboard");
  const locale = ((await getLocaleCookie()) as Lang) === "es" ? "es" : "en";
  return <VoicemailsClient view={await voicemailView()} locale={locale} />;
}
