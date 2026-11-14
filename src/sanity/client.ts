import "server-only";
import { createClient } from "next-sanity";
import { projectId, dataset, apiVersion } from "./env";

/**
 * Read-only, server-only client. The dataset is PRIVATE, so every read needs
 * SANITY_API_READ_TOKEN (Viewer role). Never prefix that variable with NEXT_PUBLIC_
 * and never import this file from a client component ("server-only" enforces it).
 */
export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false, // authenticated reads bypass the CDN anyway; freshness comes from tag revalidation
  token: process.env.SANITY_API_READ_TOKEN,
  perspective: "published",
});
