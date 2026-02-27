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
    const activePolls = await prisma.poll.findMany({
      where: {
        eventId: params.id,
        active: true,
      },
      include: {
        options: true, // Include poll options
        responses: true, // Include all responses for vote counts
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    // Get user's votes (which polls they've already voted on)
    const userResponses = await prisma.pollResponse.findMany({
      where: {
        sessionToken: checkIn.sessionToken,
        pollId: { in: activePolls.map((p) => p.id) },
      },
      select: {
        pollId: true,
      },
    });

    const votedPollIds = userResponses.map((r) => r.pollId);

    // Format polls with vote counts
    const formattedPolls = activePolls.map((poll) => {
      // Count votes per option
      const voteCounts = poll.responses.reduce(
        (acc: Record<string, number>, response) => {
          acc[response.selectedOptionId] =
            (acc[response.selectedOptionId] || 0) + 1;
          return acc;
        },
        {},
      );

      return {
        id: poll.id,
        questionEn: poll.questionEn,
        questionEs: poll.questionEs,
        active: poll.active,
        hasVoted: votedPollIds.includes(poll.id), // Did user vote on this poll?
        totalVotes: poll.responses.length,
        options: poll.options.map((option) => ({
          id: option.id,
          textEn: option.textEn,
          textEs: option.textEs,
          votes: voteCounts[option.id] || 0,
          percentage:
            poll.responses.length > 0
              ? Math.round(
                  ((voteCounts[option.id] || 0) / poll.responses.length) * 100,
                )
              : 0,
        })),
      };
    });

    return NextResponse.json({ formattedPolls, votedPollIds });
  } catch (error) {
    console.error("Polls fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch polls" },
      { status: 500 },
    );
  }
}
