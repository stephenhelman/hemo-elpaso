// src/app/api/user/set-locale/route.ts
import { NextResponse } from "next/server";
import { getSession } from "@auth0/nextjs-auth0";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const session = await getSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const patient = await prisma.patient.findUnique({
      where: { auth0Id: session.user.sub },
      select: { preferredLanguage: true },
    });

    const locale = patient?.preferredLanguage || "en";

    const response = NextResponse.json({ locale });

    response.cookies.set("locale", locale, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      httpOnly: false, // IMPORTANT: Allow client access
    });

    return response;
  } catch (error) {
    console.error("Error setting locale:", error);
    return NextResponse.json(
      { error: "Failed to set locale" },
      { status: 500 },
    );
  }
}
