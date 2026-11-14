import { getLocaleCookie } from "@/lib/locale";
import type { Metadata } from "next";
import type { Lang } from "@/types";
import { registrationOpen } from "@/lib/registration";

export async function generateMetadata(): Promise<Metadata> {
  const locale = (await getLocaleCookie()) as Lang;
  const es = locale === "es";
  return {
    robots: registrationOpen() ? undefined : { index: false, follow: false },
    title: es ? "Regístrate para Recibir Información" : "Register for Information",
    description: es
      ? "Regístrate para recibir información sobre eventos y servicios de Hemophilia Outreach of El Paso."
      : "Register to receive information about Hemophilia Outreach of El Paso events and services.",
  };
}

export default function RegisterInfoLayout({ children }: { children: React.ReactNode }) {
  return children;
}
