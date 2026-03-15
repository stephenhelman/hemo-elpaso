import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@auth0/nextjs-auth0";
import { prisma } from "@/lib/db";
import { AuditAction } from "@prisma/client";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { questionId: string } },
) {
  try {
    const { admin, error } = await requirePermission("canManageEvents");
    if (error) return error;

    const body = await request.json();
    const { answerEn, answerEs, answeredBy } = body;

    const question = await prisma.eventQuestion.update({
      where: { id: params.questionId },
      data: {
        answered: true,
        answerEn,
        answerEs,
        answeredBy,
        answeredAt: new Date(),
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        patientId: admin.id,
        action: AuditAction.QUESTION_ANSWERED,
        resourceType: "EventQuestion",
        resourceId: params.questionId,
        details: `Answered question: ${question.questionEn.substring(0, 50)}...`,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Answer save error:", error);
    return NextResponse.json(
      { error: "Failed to save answer" },
      { status: 500 },
    );
  }
}
