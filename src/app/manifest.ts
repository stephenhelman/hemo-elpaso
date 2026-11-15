import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Hemophilia Outreach of El Paso",
    short_name: "HOEP",
    description: "Supporting individuals and families affected by bleeding disorders in El Paso.",
    start_url: "/",
    display: "browser",
    background_color: "#FFFFFF",
    theme_color: "#8B1538",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
