"use client";

import { translateEnum } from "@/translation/enumTranslation";
import { eventTopicEnum } from "@/translation/enumConfig";
import type { Lang } from "@/types";

interface Props {
  lang: Lang;
}

export function EventFilterOptions({ lang }: Props) {
  const enumValues = Object.keys(eventTopicEnum).map((value, i) => {
    return (
      <option key={i} value={value}>
        {translateEnum(eventTopicEnum, value, lang)}
      </option>
    );
  });
  return (
    <>
      <option value="all">
        {lang === "en" ? "All Categories" : "Todas las categorías"}
      </option>
      {enumValues}
    </>
  );
}
