import { prisma } from "./db";

interface MatchScore {
  eventId: string;
  score: number;
  reasons: string[];
}

export async function getRecommendedEvents(patientId: string, limit = 10) {
  // Get patient with preferences
  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
    include: {
      preferences: true,
      profile: true,
      familyMembers: true,
    },
  });

  if (!patient || !patient.preferences) {
    return [];
  }

  // Get all published upcoming events with targeting
  const events = await prisma.event.findMany({
    where: {
      status: "published",
      eventDate: {
        gte: new Date(),
      },
    },
    include: {
      targeting: true,
      _count: {
        select: { rsvps: true },
      },
    },
  });

  // Score each event
  const scores: MatchScore[] = events.map((event) => {
    let score = 0;
    const reasons: string[] = [];

    // Topic/Category match (40 points max)
    if (patient.preferences!.interestedTopics.includes(event.category)) {
      score += 40;
      reasons.push("Matches your interests");
    }

    // EventTargeting - Condition match (30 points)
    if (event.targeting) {
      const patientCondition = patient.profile!.primaryCondition;
      if (
        event.targeting.targetConditions.length === 0 ||
        event.targeting.targetConditions.includes(patientCondition)
      ) {
        score += 30;
        reasons.push("Relevant to your condition");
      }

      // Severity match (15 points)
      const patientSeverity = patient.profile!.severity;
      if (
        event.targeting.targetSeverity.length === 0 ||
        event.targeting.targetSeverity.includes(patientSeverity)
      ) {
        score += 15;
      }
    }

    // Age appropriateness (20 points)
    const hasChildren = patient.familyMembers.some(
      (m) => m.relationship === "child",
    );
    if (event.targetAudience === "youth" && hasChildren) {
      score += 20;
      reasons.push("Great for families with kids");
    } else if (
      event.targetAudience === "families" &&
      patient.familyMembers.length > 0
    ) {
      score += 20;
      reasons.push("Perfect for your family");
    } else if (event.targetAudience === "all") {
      score += 10;
      reasons.push("Open to all ages");
    }

    // Capacity check (10 points if not full, heavy penalty if full)
    const maxCapacity = event.maxCapacity || 999;
    const spotsLeft = maxCapacity - event._count.rsvps;
    if (spotsLeft > 0) {
      score += 10;
      if (spotsLeft <= 5) {
        reasons.push("⚡ Limited spots remaining!");
      }
    } else {
      score -= 50; // Heavily penalize full events
      reasons.push("Event is full");
    }

    // Time preference match (15 points)
    const eventDate = new Date(event.eventDate);
    const dayOfWeek = eventDate.getDay();
    const hour = eventDate.getHours();

    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const timeOfDay =
      hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";

    const timeKey = `${isWeekend ? "weekend" : "weekday"}_${timeOfDay}`;
    if (patient.preferences!.preferredEventTimes.includes(timeKey)) {
      score += 15;
      reasons.push("Fits your schedule");
    }

    // Language match (10 points)
    const preferredLang = patient.preferences!.languagePreference;
    if (event.language === preferredLang || event.language === "both") {
      score += 10;
    } else {
      score -= 20; // Penalize language mismatch
    }

    // Recency boost (5 points for events in next 2 weeks)
    const daysUntil = Math.floor(
      (eventDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
    );
    if (daysUntil <= 14) {
      score += 5;
      reasons.push("🔥 Coming up soon");
    }

    // Priority boost for featured events
    if (event.isPriority) {
      score += 25;
      reasons.push("⭐ Featured event");
    }

    return {
      eventId: event.id,
      score,
      reasons: reasons.filter(Boolean),
    };
  });

  // Sort by score and return top matches
  return scores
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .filter((match) => match.score > 0); // Only return events with positive scores
}

export async function shouldRecommendEvent(
  patientId: string,
  eventId: string,
): Promise<{ recommend: boolean; score: number; reasons: string[] }> {
  const recommendations = await getRecommendedEvents(patientId, 100);
  const match = recommendations.find((r) => r.eventId === eventId);

  if (!match) {
    return { recommend: false, score: 0, reasons: [] };
  }

  return {
    recommend: match.score >= 30, // Recommend if score is 30+
    score: match.score,
    reasons: match.reasons,
  };
}
