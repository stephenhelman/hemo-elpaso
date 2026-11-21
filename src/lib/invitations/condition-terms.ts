/**
 * Guard for diagnosis-targeted events: does the text people will see in the invitation (title, description, either
 * language) name a condition? Warning only, never a block. Case-insensitive; accents on the Spanish forms are
 * not required to match. "factor" and "carrier" are deliberately broad (the board asked for them).
 */
const CONDITION_RE = /\b(?:hemophili\w*|hemofili\w*|von[\s-]+willebrand|vwd|factors?|carriers?|portador(?:a|as|es)?)\b/i;

export const namesACondition = (...texts: (string | null | undefined)[]) =>
  texts.some((t) => !!t && CONDITION_RE.test(t));

/** True when the event is targeted by diagnosis AND its invitation text names a condition. */
export function invitationNamesCondition(event: {
  titleEn: string; titleEs: string; descriptionEn?: string | null; descriptionEs?: string | null;
  targeting?: { targetConditions: string[] } | null;
}): boolean {
  if (!event.targeting || event.targeting.targetConditions.length === 0) return false;
  return namesACondition(event.titleEn, event.titleEs, event.descriptionEn, event.descriptionEs);
}

export const CONDITION_WARNING = {
  en: "This invitation only goes to families with a specific condition. Its title or description names a condition, which could reveal a family's diagnosis to anyone who sees the email.",
  es: "Esta invitación solo se envía a familias con una condición específica. Su título o descripción nombra una condición, lo que podría revelar el diagnóstico de una familia a cualquiera que vea el correo.",
} as const;
