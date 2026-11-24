import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyUnsubscribeToken } from "@/lib/unsubscribe-token";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  const l = req.nextUrl.searchParams.get("lang");
  const langQs = l === "es" || l === "en" ? `&lang=${l}` : "";

  if (!token) {
    return NextResponse.redirect(
      new URL(`/unsubscribe?error=missing${langQs}`, req.url),
    );
  }

  const patientId = verifyUnsubscribeToken(token);
  if (!patientId) {
    return NextResponse.redirect(
      new URL(`/unsubscribe?error=invalid${langQs}`, req.url),
    );
  }

  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
    select: { id: true, emailOptOut: true, mergedIntoId: true },
  });
  // A link from a record that was merged into another: the opt-out applies to the surviving household.
  const target = patient?.mergedIntoId
    ? await prisma.patient.findUnique({ where: { id: patient.mergedIntoId }, select: { id: true, emailOptOut: true, mergedIntoId: true } })
    : patient;

  if (!target) {
    return NextResponse.redirect(
      new URL(`/unsubscribe?error=notfound${langQs}`, req.url),
    );
  }

  // Opts out of invitation emails only. Transactional emails (RSVP confirmation,
  // reminders) still go to people who RSVP. Consent records are not touched.
  if (!target.emailOptOut) {
    await prisma.patient.update({
      where: { id: target.id },
      data: { emailOptOut: true },
    });
  }

  return NextResponse.redirect(new URL(`/unsubscribe?success=1${langQs}`, req.url));
}
