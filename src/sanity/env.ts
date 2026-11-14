// The project id is not a secret (it is in every Sanity client URL).
export const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "ed5kyl4v";
export const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";
export const apiVersion = "2025-01-01";
