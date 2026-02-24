"use client";

import { translateEnum } from "@/translation/enumTranslation";
import type { Lang } from "@/types";

interface Props {
  allVal: "status" | "topic";
  lang: Lang;
  enumVals: Record<string, Record<string, string>>;
}

export function EventFilterOptions({ lang, enumVals, allVal }: Props) {
  const allConfig = {
    status: { en: "Statuses", es: "los Estados" },
    topic: { en: "Categories", es: "las Categorías" },
  };
  const enumValues = Object.keys(enumVals).map((value, i) => {
    return (
      <option key={i} value={value}>
        {translateEnum(enumVals, value, lang)}
      </option>
    );
  });
  return (
    <>
      <option value="all">
        {lang === "en" ? "All" : "Todos"} {allConfig[allVal][lang]}
      </option>
      {enumValues}
    </>
  );
}
