import type { MinutesSection } from "./MinutesEditor";

interface Props {
  sections: MinutesSection[];
  lang: "en" | "es";
  isPublicView?: boolean;
}

export default function MinutesViewer({
  sections,
  lang,
  isPublicView = false,
}: Props) {
  const visibleSections = isPublicView
    ? sections.filter((s) => !s.redacted)
    : sections;

  if (visibleSections.length === 0) {
    return (
      <p className="text-neutral-400 italic text-sm">No content available.</p>
    );
  }

  return (
    <div className="space-y-4">
      {visibleSections.map((section, index) => {
        const content = lang === "es" ? section.contentEs : section.contentEn;

        if (section.type === "header") {
          return (
            <h3
              key={index}
              className="text-lg font-bold text-neutral-900 border-b border-neutral-200 pb-2 mt-6 first:mt-0"
            >
              {content}
            </h3>
          );
        }

        return (
          <p key={index} className="text-neutral-700 text-sm leading-relaxed">
            {content}
          </p>
        );
      })}
    </div>
  );
}
