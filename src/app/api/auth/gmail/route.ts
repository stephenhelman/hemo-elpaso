import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@auth0/nextjs-auth0";
import { prisma } from "@/lib/db";
import { getGmailAuthUrl } from "@/lib/gmail-oauth";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const patient = await prisma.patient.findUnique({
    where: { auth0Id: session.user.sub },
    select: { id: true },
  });
  if (!patient) {
    return NextResponse.json({ error: "Patient not found" }, { status: 404 });
  }

  const boardRoleId = request.nextUrl.searchParams.get("boardRoleId");
  if (!boardRoleId) {
    return NextResponse.json(
      { error: "boardRoleId is required" },
      { status: 400 },
    );
  }

  // Verify the BoardRole belongs to this patient and is active
  const boardRole = await prisma.boardRole.findUnique({
    where: { id: boardRoleId },
    select: { id: true, patientId: true, active: true },
  });
  if (!boardRole || boardRole.patientId !== patient.id || !boardRole.active) {
    return NextResponse.json(
      { error: "Board role not found or not authorized" },
      { status: 403 },
    );
  }

  const authUrl = getGmailAuthUrl(boardRoleId, patient.id);
  return NextResponse.redirect(authUrl);
}
