"use client";

import { createElement } from "react";

/** The HOEP favicon as the Studio's project icon / navbar logo (served from /public/brand, same origin as the Studio). */
export function BrandIcon() {
  return createElement("img", {
    src: "/brand/hoep-favicon.svg",
    alt: "Hemophilia Outreach of El Paso",
    style: { height: "1.5em", width: "1.5em", display: "block", objectFit: "contain" },
  });
}

export function BrandLogo() {
  return createElement(
    "span",
    { style: { display: "inline-flex", alignItems: "center", gap: 8, fontWeight: 600 } },
    createElement("img", { src: "/brand/hoep-favicon.svg", alt: "", style: { height: 28, width: 28 } }),
    "HOEP site content",
  );
}
