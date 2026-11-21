import Link from "next/link";

const L = {
  en: { privacy: "Privacy Policy", children: "Children and Age Policy", terms: "Terms of Use" },
  es: { privacy: "Política de Privacidad", children: "Política para Menores y Edad", terms: "Términos de Uso" },
} as const;

/** One small line of links to the legal pages. Opens in a new tab by default so a half-filled form is not lost. */
export default function LegalLinks({
  locale, which = ["privacy"], newTab = true, className = "text-xs text-neutral-500",
}: { locale: "en" | "es"; which?: ("privacy" | "children" | "terms")[]; newTab?: boolean; className?: string }) {
  const t = L[locale];
  return (
    <p className={className}>
      {which.map((k, i) => (
        <span key={k}>
          {i > 0 && " · "}
          <Link
            href={`/${k}`}
            className="underline underline-offset-2 hover:text-neutral-800"
            {...(newTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          >
            {t[k]}
          </Link>
        </span>
      ))}
    </p>
  );
}
