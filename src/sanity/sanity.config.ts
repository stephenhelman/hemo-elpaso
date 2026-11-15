"use client";

import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { projectId, dataset } from "./env";
import { schemaTypes, SINGLETON_TYPES } from "./schemas";
import { structure } from "./structure";

/** Studio config. Runs in the browser and talks only to Sanity (no database access). */
export default defineConfig({
  name: "hoep",
  title: "HOEP site content",
  projectId,
  dataset,
  basePath: "/admin/studio",
  plugins: [structureTool({ structure })],
  schema: {
    types: schemaTypes,
    // Singletons are never created from the "new document" menu.
    templates: (templates) => [
      ...templates.filter(({ schemaType }) => !SINGLETON_TYPES.includes(schemaType)),
      // "New" inside a category list pre-fills the category.
      {
        id: "resource-in-category",
        title: "Resource",
        schemaType: "resource",
        parameters: [{ name: "category", type: "string" }],
        value: (params: { category?: string }) => ({ category: params.category, active: true }),
      },
    ],
  },
  document: {
    // Singletons cannot be deleted, duplicated or unpublished.
    actions: (input, { schemaType }) =>
      SINGLETON_TYPES.includes(schemaType)
        ? input.filter(({ action }) => action && !["delete", "duplicate", "unpublish"].includes(action))
        : input,
    newDocumentOptions: (prev, { creationContext }) =>
      creationContext.type === "global" ? prev.filter((t) => !SINGLETON_TYPES.includes(t.templateId)) : prev,
  },
});
