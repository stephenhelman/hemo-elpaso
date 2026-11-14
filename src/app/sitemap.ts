import { siteUrl } from "@/lib/site";
import { registrationOpen } from "@/lib/registration";
import { MetadataRoute } from "next";
import { prisma } from "@/lib/db";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = siteUrl();

  // Get all published events
  const events = await prisma.event.findMany({
    where: { status: "published" },
    select: { slug: true, updatedAt: true },
  });

  // Static pages (high priority)
  const staticPages = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/events`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/resources`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/scholarships`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/get-involved`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    },
  ];

  // Public sign-up page only while REGISTRATION_OPEN=true
  if (registrationOpen()) {
    staticPages.push({
      url: `${baseUrl}/register-info`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    });
  }

  // Dynamic event pages
  const eventPages = events.map((event) => ({
    url: `${baseUrl}/events/${event.slug}`,
    lastModified: event.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  return [...staticPages, ...eventPages];
}
