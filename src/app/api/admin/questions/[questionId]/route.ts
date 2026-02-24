import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@auth0/nextjs-auth0";
import { prisma } from "@/lib/db";
import { AuditAction } from "@prisma/client";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { questionId: string } },
) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = await prisma.patient.findUnique({
      where: { auth0Id: session.user.sub },
    });

    if (!admin || !["board", "admin"].includes(admin.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const question = await prisma.eventQuestion.findUnique({
      where: { id: params.questionId },
    });

    if (!question) {
      return NextResponse.json(
        { error: "Question not found" },
        { status: 404 },
      );
    }

    await prisma.eventQuestion.delete({
      where: { id: params.questionId },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        patientId: admin.id,
        action: AuditAction.QUESTION_DELETED,
        resourceType: "EventQuestion",
        resourceId: params.questionId,
        details: `Deleted question: ${question.questionEn.substring(0, 50)}...`,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Question delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete question" },
      { status: 500 },
    );
  }
}
