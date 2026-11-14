import type { Lang } from "@/types";

type LanguageMap = {
  en: string;
  es: string;
};

export function translateEnum(config: Record<string, Record<Lang, string>>, value: string, lang: Lang) {
  return config[value][lang];
}
