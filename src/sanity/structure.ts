import type { StructureResolver } from "sanity/structure";
import { PAGE_TYPES } from "./schemas/documents/pages";

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
    ]);
