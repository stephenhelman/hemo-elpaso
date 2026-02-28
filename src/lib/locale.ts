"use server";

import { Lang } from "@/types";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export async function setLocaleCookie(locale: "en" | "es") {
  const cookieStore = await cookies();
  cookieStore.set("locale", locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  revalidatePath("/", "layout");
}

export async function getLocaleCookie() {
  const cookieStore = await cookies();
  return cookieStore.get("locale")?.value || ("en" as Lang);
}
