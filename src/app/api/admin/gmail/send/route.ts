import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { sendViaGmail } from "@/lib/gmail-oauth";
import { AuditAction } from "@prisma/client";

export async function POST(request: NextRequest) {
  const { admin, error } = await requirePermission("canSendIndividualEmails");
  if (error) return error;

  let body: {
    boardRoleId: string;
    to: string;
    subject: string;
    htmlBody: string;
    toPatientId?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { boardRoleId, to, subject, htmlBody, toPatientId } = body;
  if (!boardRoleId || !to || !subject || !htmlBody) {
    return NextResponse.json(
      { error: "boardRoleId, to, subject, and htmlBody are required" },
      { status: 400 },
    );
  }

  // Verify the BoardRole belongs to the calling admin and is active
  const boardRole = await prisma.boardRole.findUnique({
    where: { id: boardRoleId },
    select: {
      id: true,
      patientId: true,
      active: true,
      fromEmail: true,
      role: true,
      gmailRefreshToken: true,
    },
  });

  if (!boardRole || boardRole.patientId !== admin.id || !boardRole.active) {
    return NextResponse.json(
      { error: "Board role not found or not authorized" },
      { status: 403 },
    );
  }

  if (!boardRole.gmailRefreshToken) {
    return NextResponse.json(
      { error: "Gmail not connected for this board role" },
      { status: 409 },
    );
  }

  const fromEmail =
    boardRole.fromEmail ??
    `${boardRole.role.toLowerCase().replace(/_/g, "")}@hemo-el-paso.org`;

  const ROLE_NAMES: Record<string, string> = {
    PRESIDENT: "HOEP President",
    VICE_PRESIDENT: "HOEP Vice President",
    SECRETARY: "HOEP Secretary",
    COMMUNICATIONS_LEAD: "HOEP Communications",
  };
  const fromName = ROLE_NAMES[boardRole.role];

  let messageId: string;
  try {
    messageId = await sendViaGmail({
      boardRoleId,
      to,
      subject,
      htmlBody,
      fromEmail,
      fromName,
      replyTo: admin.email,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[gmail/send] sendViaGmail error:", err);
    return NextResponse.json(
      { error: `Failed to send email: ${message}` },
      { status: 502 },
    );
  }

  // Log to CommunicationLog
  await prisma.communicationLog.create({
    data: {
      boardRoleId,
      patientId: toPatientId ?? null,
      subject,
      bodyPreview: htmlBody.replace(/<[^>]+>/g, "").slice(0, 200),
      gmailMessageId: messageId,
      fromEmail,
      toEmail: to,
    },
  });

  // Audit log
  await prisma.auditLog.create({
    data: {
      action: AuditAction.GMAIL_CONNECTED, // reuse closest relevant action; no EMAIL_SENT enum exists
      patientId: admin.id,
      details: `Email sent via Gmail from ${fromEmail} to ${to} — subject: ${subject}`,
      resourceType: "CommunicationLog",
    },
  });

  return NextResponse.json({ success: true, messageId });
}
