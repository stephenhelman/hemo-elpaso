import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@auth0/nextjs-auth0";
import { prisma } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get patient to verify check-in
    const patient = await prisma.patient.findUnique({
      where: { auth0Id: session.user.sub },
    });

    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    // Verify patient is checked in
    const checkIn = await prisma.checkIn.findFirst({
      where: {
        eventId: params.id,
        patientId: patient.id,
      },
    });

    if (!checkIn) {
      return NextResponse.json({ error: "Not checked in" }, { status: 403 });
    }

    // Get active polls for this event
    const interactions = await prisma.eventInteraction.findMany({
      where: {
        eventId: params.id,
        type: "poll",
        active: true,
      },
      orderBy: {
        sequenceOrder: "asc",
      },
    });

    // Get user's votes
    const responses = await prisma.interactionResponse.findMany({
      where: {
        sessionToken: checkIn.sessionToken,
        interactionId: { in: interactions.map((i) => i.id) },
      },
      select: {
        interactionId: true,
      },
    });

    const votedPollIds = responses.map((r) => r.interactionId);

    // Format polls with vote counts
    const polls = await Promise.all(
      interactions.map(async (interaction) => {
        const allResponses = await prisma.interactionResponse.findMany({
          where: { interactionId: interaction.id },
        });

        const options = (interaction.options as any).options || [];
        const voteCounts = allResponses.reduce(
          (acc: Record<string, number>, r: any) => {
            const optionId = r.responseData.optionId;
            acc[optionId] = (acc[optionId] || 0) + 1;
            return acc;
          },
          {},
        );

        return {
          id: interaction.id,
          titleEn: interaction.titleEn,
          titleEs: interaction.titleEs,
          active: interaction.active,
          totalVotes: allResponses.length,
          options: options.map((opt: any) => ({
            id: opt.id,
            text: opt.text,
            votes: voteCounts[opt.id] || 0,
          })),
        };
      }),
    );

    return NextResponse.json({ polls, votedPollIds });
  } catch (error) {
    console.error("Polls fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch polls" },
      { status: 500 },
    );
  }
}
