import type { Lang } from "@/types";

type LanguageMap = {
  en: string;
  es: string;
};

export function translateEnum(config, value: string, lang: Lang) {
  return config[value][lang];
}
