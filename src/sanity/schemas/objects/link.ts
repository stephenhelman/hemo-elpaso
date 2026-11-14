import { defineField, defineType } from "sanity";
import { INTERNAL_ROUTES } from "../../options";

export const link = defineType({
  name: "link",
  title: "Link",
  type: "object",
  fields: [
    defineField({ name: "label", type: "localizedString", validation: (r) => r.required() }),
    defineField({
      name: "type",
      type: "string",
      initialValue: "internal",
      options: {
        layout: "radio",
        list: [
          { title: "Page on this site", value: "internal" },
          { title: "External website", value: "external" },
          { title: "Phone number", value: "phone" },
          { title: "Email address", value: "email" },
        ],
      },
      validation: (r) => r.required(),
    }),
    defineField({
      name: "value",
      type: "string",
      description: "Page path, https:// URL, phone digits, or email, depending on the type above.",
      validation: (r) =>
        r.required().custom((v, ctx: any) => {
          const t = ctx.parent?.type;
          if (!v) return true;
          if (t === "internal")
            return INTERNAL_ROUTES.some(([p]) => p === v) || "Use one of: " + INTERNAL_ROUTES.map(([p]) => p).join(", ");
          if (t === "external") return /^https:\/\/[^\s]+$/.test(v) || "Must start with https://";
          if (t === "phone") return /^\+?[0-9]{10,15}$/.test(v) || "Digits only, e.g. +19156218291";
          if (t === "email") return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || "Not a valid email.";
          return true;
        }),
    }),
  ],
  preview: { select: { title: "label.en", subtitle: "value" } },
});
