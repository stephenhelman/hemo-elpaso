import { Lang } from "@/types";
import { eventsActionTranslation } from "@/translation/eventsPage";

interface Props {
  length: number;
  lang: Lang;
}

export function EventsShowingCaption({ length, lang }: Props) {
  const t = eventsActionTranslation[lang];
  return (
    <p className="text-sm text-neutral-500 mt-4">
      {`${t.showTagOne} ${length} ${t.showTagTwo}${length !== 1 ? "s" : ""}`}
    </p>
  );
}
