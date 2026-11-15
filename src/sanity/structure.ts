import type { StructureResolver } from "sanity/structure";
import { PAGE_TYPES } from "./schemas/documents/pages";
import { RESOURCE_CATEGORIES } from "./options";

const singleton = (S: any, type: string, title: string) =>
  S.listItem()
    .title(title)
    .id(type)
    .child(S.document().schemaType(type).documentId(type).title(title));

export const structure: StructureResolver = (S) =>
  S.list()
    .title("Site content")
    .items([
      singleton(S, "siteSettings", "Site settings"),
      S.listItem()
        .title("Pages")
        .id("pages")
        .child(
          S.list()
            .title("Pages")
            .items(PAGE_TYPES.map((p) => singleton(S, p.name, p.title))),
        ),
      S.divider(),
      S.documentTypeListItem("person").title("People"),
      S.documentTypeListItem("scholarship").title("Scholarships"),
      S.listItem()
        .title("Resources")
        .id("resources")
        .child(
          S.list()
            .title("Resources by category")
            .items(
              RESOURCE_CATEGORIES.map((c) =>
                S.listItem()
                  .title(c.title)
                  .id(`resources-${c.value}`)
                  .child(
                    S.documentList()
                      .title(c.title)
                      .schemaType("resource")
                      .filter('_type == "resource" && category == $category')
                      .params({ category: c.value })
                      .defaultOrdering([{ field: "order", direction: "asc" }])
                      .initialValueTemplates([S.initialValueTemplateItem("resource-in-category", { category: c.value })]),
                  ),
              ),
            ),
        ),
    ]);
