import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { AuditAction } from "@prisma/client";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { questionId: string } },
) {
  try {
    const { admin, error } = await requirePermission("canManageEvents");
    if (error) return error;

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
