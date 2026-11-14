"use client";

import { PortableText, type PortableTextComponents } from "@portabletext/react";
import Link from "next/link";
import type { Lang } from "@/types";
import { pick, type Localized } from "@/sanity/helpers/pick";

const components: PortableTextComponents = {
  marks: {
    emphasis: ({ children }) => <span className="text-primary-400">{children}</span>,
    strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
    em: ({ children }) => <em>{children}</em>,
    link: ({ value, children }) => {
      const href: string = value?.href ?? "#";
      return href.startsWith("/") ? (
        <Link href={href} className="text-primary underline underline-offset-2">{children}</Link>
      ) : (
        <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" className="text-primary underline underline-offset-2">
          {children}
        </a>
      );
    },
  },
  block: { normal: ({ children }) => <p className="mb-4 last:mb-0">{children}</p> },
  list: { bullet: ({ children }) => <ul className="list-disc pl-6 mb-4 space-y-1">{children}</ul> },
  listItem: { bullet: ({ children }) => <li>{children}</li> },
};

/** Body text. Unknown marks and blocks are dropped. */
export function RichText({ field, locale, className }: { field: Localized<any[]>; locale: Lang; className?: string }) {
  const value = pick(field, locale);
  if (!value) return null;
  return (
    <div className={className}>
      <PortableText value={value} components={components} />
    </div>
  );
}

/** One-line heading: renders the spans inline (with the accent mark) and no <p>. */
export function HeadingText({ field, locale }: { field: Localized<any[]>; locale: Lang }) {
  const value = pick(field, locale);
  if (!value) return null;
  return (
    <PortableText
      value={value}
      components={{
        block: { normal: ({ children }) => <>{children}</> },
        marks: { emphasis: ({ children }) => <span className="text-primary-400">{children}</span> },
      }}
    />
  );
}
