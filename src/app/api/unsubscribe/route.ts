import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyUnsubscribeToken } from "@/lib/unsubscribe-token";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(
      new URL("/unsubscribe?error=missing", req.url),
    );
  }

  const patientId = verifyUnsubscribeToken(token);
  if (!patientId) {
    return NextResponse.redirect(
      new URL("/unsubscribe?error=invalid", req.url),
    );
  }

  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
    select: { id: true, consentToContact: true },
  });

  if (!patient) {
    return NextResponse.redirect(
      new URL("/unsubscribe?error=notfound", req.url),
    );
  }

  if (patient.consentToContact) {
    await prisma.patient.update({
      where: { id: patientId },
      data: { consentToContact: false },
    });
  }

  return NextResponse.redirect(new URL("/unsubscribe?success=1", req.url));
}
