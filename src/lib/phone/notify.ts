/** Tell all four officer addresses about every routing change. Board members' names and MASKED numbers only. */
import { notifyOfficersOfAdminAction } from "@/lib/admin-notice";
import { maskNumber } from "@/lib/twilio/mode";
import { OPTIONS } from "./definitions";
import type { Notice } from "./change";
import type { BoardPerson } from "./store";

export function noticeLines(notice: Notice, actorName: string, people: BoardPerson[]) {
  const name = (id: string) => people.find((p) => p.id === id)?.name ?? "a former board member";
  const who = (x: { ownerId: string; number: string } | null, nobody: string) => (x ? `${name(x.ownerId)} ${maskNumber(x.number)}` : nobody);
  if (notice.kind === "duty") {
    const o = OPTIONS[notice.option].label;
    return {
      en: `${actorName} changed who answers “${o.en}”: from ${who(notice.from, "nobody")} to ${who(notice.to, "nobody")}.`,
      es: `${actorName} cambió quién atiende “${o.es}”: de ${who(notice.from, "nadie")} a ${who(notice.to, "nadie")}.`,
    };
  }
  if (notice.kind === "hours") {
    const o = OPTIONS[notice.option].label;
    return { en: `${actorName} changed the answering hours of “${o.en}”.`, es: `${actorName} cambió el horario de atención de “${o.es}”.` };
  }
  const target = who(notice, "");
  const cleared = (lang: "en" | "es") => (notice.cleared?.length ? ` ${lang === "en" ? "Now unassigned" : "Ahora sin asignar"}: ${notice.cleared.map((k) => OPTIONS[k].label[lang]).join(", ")}.` : "");
  if (notice.kind === "added") return { en: `${actorName} added the duty number ${target}. It can't be rung until it is verified.`, es: `${actorName} agregó el número de guardia ${target}. No puede recibir llamadas hasta que se verifique.` };
  if (notice.kind === "verified") return { en: `The duty number ${target} was verified by phone.`, es: `El número de guardia ${target} se verificó por teléfono.` };
  return { en: `${actorName} removed the duty number ${target}.${cleared("en")}`, es: `${actorName} eliminó el número de guardia ${target}.${cleared("es")}` };
}

export function notifyRoutingChange(notice: Notice, actorName: string, people: BoardPerson[]): Promise<boolean> {
  const line = noticeLines(notice, actorName, people);
  return notifyOfficersOfAdminAction({
    subjectEn: notice.kind === "duty" ? "Phone duty changed" : "Phone settings changed",
    subjectEs: notice.kind === "duty" ? "Cambió la guardia telefónica" : "Cambió la configuración del teléfono",
    linesEn: [line.en],
    linesEs: [line.es],
  });
}
