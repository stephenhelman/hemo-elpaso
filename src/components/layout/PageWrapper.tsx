"use client";

import { useLang } from "@/context/LanguageContext";
import { Lang } from "@/types";

interface Props {
  children: (lang: Lang) => React.ReactNode;
}

export default function PageWrapper({ children }: Props) {
  const { lang } = useLang();
  return <>{children(lang)}</>;
}
