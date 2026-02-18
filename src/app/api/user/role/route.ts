import { NextResponse } from "next/server";
import { getSession } from "@auth0/nextjs-auth0";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const session = await getSession();

    if (!session?.user) {
      return NextResponse.json({ role: "patient" });
    }

    const patient = await prisma.patient.findUnique({
      where: { auth0Id: session.user.sub },
      select: { role: true },
    });

    return NextResponse.json({
      role: patient?.role || "patient",
    });
  } catch (error) {
    console.error("Role check error:", error);
    return NextResponse.json({ role: "patient" });
  }
}
