"use client";

import { useState } from "react";
import type { Lang } from "@/types";
import { pick } from "@/sanity/helpers/pick";
import type { PersonData } from "@/sanity/types";

/** "Teresita Fernandez de Robles" → "TF" (first two words), or "LF" with `style="firstLast"`. */
export function initialsOf(name: string, style: "firstTwo" | "firstLast" = "firstTwo") {
  const parts = name.split(" ").filter(Boolean);
  const picked = style === "firstLast" && parts.length > 1 ? [parts[0], parts[parts.length - 1]] : parts.slice(0, 2);
  return picked.map((n) => n[0]).join("");
}

/**
 * Circle with the person's photo (served by /api/people-photo, because the dataset is private)
 * or, when there is no photo or it fails to load, their initials. `className` carries size/colour.
 */
export default function PersonAvatar({
  person,
  locale,
  className,
  initialsStyle = "firstTwo",
  size = 256,
}: {
  person: Pick<PersonData, "_id" | "name" | "photo">;
  locale: Lang;
  className: string;
  initialsStyle?: "firstTwo" | "firstLast";
  size?: 128 | 256 | 400 | 640;
}) {
  const [failed, setFailed] = useState(false);
  const v = person.photo?.v;
  const showPhoto = !!v && !failed && !person._id.startsWith("fallback");
  return (
    <div className={`${className} relative overflow-hidden`}>
      {initialsOf(person.name, initialsStyle)}
      {showPhoto && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`/api/people-photo/${encodeURIComponent(person._id)}?w=${size}&v=${encodeURIComponent(v!)}`}
          alt={pick(person.photo?.alt, locale) ?? person.name}
          loading="lazy"
          onError={() => setFailed(true)}
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}
    </div>
  );
}
