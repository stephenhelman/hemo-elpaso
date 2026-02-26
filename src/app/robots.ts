import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/portal/*", "/admin/*", "/api/*"],
      },
    ],
    sitemap: "https://hemo-el-paso.org/sitemap.xml",
  };
}
