import { prisma } from "@/lib/db";

const FALLBACK_EMAIL = "info@hemo-el-paso.org";

/**
 * Look up the active fromEmail for a board role type.
 * Returns null if no active role or no fromEmail configured.
 */
async function getBoardEmail(
  role: "PRESIDENT" | "VICE_PRESIDENT" | "SECRETARY" | "TREASURER" | "COMMUNICATIONS_LEAD",
): Promise<string | null> {
  const boardRole = await prisma.boardRole.findFirst({
    where: { role, active: true, fromEmail: { not: null } },
    select: { fromEmail: true },
  });
  return boardRole?.fromEmail ?? null;
}

/**
 * Returns the best TO address for a volunteer inquiry based on areas of interest.
 * Priority: President > Communications Lead > Secretary > info@
 * Board/Professional always → President.
 */
export async function getVolunteerRecipient(areasOfInterest: string[]): Promise<string> {
  const hasBoardInterest =
    areasOfInterest.includes("board_membership") ||
    areasOfInterest.includes("professional_skills");
  if (hasBoardInterest) {
    const president = await getBoardEmail("PRESIDENT");
    return president ?? FALLBACK_EMAIL;
  }

  const hasCommunityOutreach = areasOfInterest.includes("community_outreach");
  if (hasCommunityOutreach) {
    const comms = await getBoardEmail("COMMUNICATIONS_LEAD");
    if (comms) return comms;
    const president = await getBoardEmail("PRESIDENT");
    return president ?? FALLBACK_EMAIL;
  }

  // event_support, admin_help, other → Secretary
  const secretary = await getBoardEmail("SECRETARY");
  return secretary ?? FALLBACK_EMAIL;
}

/**
 * Returns the best TO address for a contact form submission based on reason.
 *
 * Routing map:
 *   family    → Secretary → info@
 *   volunteer → Secretary → info@
 *   sponsor   → Treasurer → Secretary → info@
 *   media     → Communications Lead → President → info@
 *   general / other / fallback → info@
 */
export async function getContactRecipient(reason: string): Promise<string> {
  switch (reason) {
    case "family":
    case "volunteer": {
      const secretary = await getBoardEmail("SECRETARY");
      return secretary ?? FALLBACK_EMAIL;
    }

    case "sponsor": {
      const treasurer = await getBoardEmail("TREASURER");
      if (treasurer) return treasurer;
      const secretary = await getBoardEmail("SECRETARY");
      return secretary ?? FALLBACK_EMAIL;
    }

    case "media": {
      const comms = await getBoardEmail("COMMUNICATIONS_LEAD");
      if (comms) return comms;
      const president = await getBoardEmail("PRESIDENT");
      return president ?? FALLBACK_EMAIL;
    }

    default:
      return FALLBACK_EMAIL;
  }
}
