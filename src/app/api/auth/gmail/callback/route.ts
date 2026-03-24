import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@auth0/nextjs-auth0";
import { prisma } from "@/lib/db";
import { exchangeCodeAndStore } from "@/lib/gmail-oauth";
import { AuditAction } from "@prisma/client";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const stateRaw = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    console.error("[gmail-callback] OAuth error:", error);
    return NextResponse.redirect(
      new URL("/admin/dashboard?gmailError=1", request.url),
    );
  }

  if (!code || !stateRaw) {
    return NextResponse.redirect(
      new URL("/admin/dashboard?gmailError=1", request.url),
    );
  }

  let boardRoleId: string;
  let patientId: string;
  try {
    const state = JSON.parse(stateRaw) as {
      boardRoleId: string;
      patientId: string;
    };
    boardRoleId = state.boardRoleId;
    patientId = state.patientId;
  } catch {
    return NextResponse.redirect(
      new URL("/admin/dashboard?gmailError=1", request.url),
    );
  }

  // Security: verify session matches the patientId from state
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.redirect(new URL("/api/auth/login", request.url));
  }

  const sessionPatient = await prisma.patient.findUnique({
    where: { auth0Id: session.user.sub },
    select: { id: true },
  });
  if (!sessionPatient || sessionPatient.id !== patientId) {
    return NextResponse.redirect(
      new URL("/admin/dashboard?gmailError=1", request.url),
    );
  }

  try {
    await exchangeCodeAndStore(code, boardRoleId, patientId);

    // Update BoardOnboarding if it exists
    const onboarding = await prisma.boardOnboarding.findUnique({
      where: { boardRoleId },
    });
    if (onboarding) {
      await prisma.boardOnboarding.update({
        where: { boardRoleId },
        data: {
          gmailConnected: true,
          gmailConnectedAt: new Date(),
        },
      });
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: AuditAction.GMAIL_CONNECTED,
        patientId,
        details: `Gmail connected for boardRoleId ${boardRoleId}`,
      },
    });
  } catch (err) {
    console.error("[gmail-callback] Token exchange failed:", err);
    return NextResponse.redirect(
      new URL("/admin/dashboard?gmailError=1", request.url),
    );
  }

  return NextResponse.redirect(
    new URL("/admin/dashboard?gmailConnected=1", request.url),
  );
}
