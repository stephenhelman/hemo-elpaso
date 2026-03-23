import { faker } from "@faker-js/faker";
import { prisma, randomInt, randomBoolean, randomItem } from "../seed-utils";

const conditions = ["Hemophilia_a", "Hemophilia_b", "Von_Willebrand"];
const severities = ["mild", "moderate", "severe"];

export async function seedFamiliesAndVolunteers() {
  console.log("🌱 Seeding families and volunteer profiles...");

  const patients = await prisma.patient.findMany({
    where: { role: "patient" },
    include: { contactProfile: true },
  });

  // ══════════════════════════════════════════════════════════════════════════
  // Create 8 Family groups from the first 8 patients
  // ══════════════════════════════════════════════════════════════════════════
  const familyPatients = patients.slice(0, 8);
  let familyCount = 0;
  let membershipCount = 0;

  for (const patient of familyPatients) {
    const lastName = patient.contactProfile?.lastName ?? "Family";

    const family = await prisma.family.create({
      data: {
        name: `${lastName} Family`,
        primaryPatientId: patient.id,
      },
    });
    familyCount++;

    const numMembers = randomInt(1, 3);

    for (let j = 0; j < numMembers; j++) {
      const memberFirstName = faker.person.firstName();
      const memberDOB = faker.date.birthdate({ min: 1985, max: 2020, mode: "year" });
      const ageYears = new Date().getFullYear() - memberDOB.getFullYear();
      const ageTier = ageYears < 5 ? "RECORD_ONLY" : ageYears < 18 ? "YOUTH" : "ADULT";
      const hasDisorder = randomBoolean(0.4);

      // Last member of a multi-member family occasionally pending invite
      const isPendingInvite =
        j === numMembers - 1 && ageTier === "ADULT" && numMembers > 1 && randomBoolean(0.35);
      const status = isPendingInvite ? "PENDING_INVITE" : "ACTIVE";

      await prisma.familyMembership.create({
        data: {
          familyId: family.id,
          firstName: memberFirstName,
          lastName,
          dateOfBirth: memberDOB,
          relationship: randomItem(["spouse", "son", "daughter", "sibling", "parent"]),
          ageTier,
          status,
          inviteEmail: isPendingInvite ? faker.internet.email().toLowerCase() : null,
          inviteSentAt: isPendingInvite ? faker.date.recent({ days: 14 }) : null,
          parentalConsentGiven: ageTier === "YOUTH",
          parentalConsentAt: ageTier === "YOUTH" ? faker.date.recent({ days: 60 }) : null,
          parentalConsentBy: ageTier === "YOUTH" ? "admin@hoep.org" : null,
          hasBleedingDisorder: hasDisorder,
          disorderCondition: hasDisorder ? randomItem(conditions) : null,
          disorderSeverity: hasDisorder ? randomItem(severities) : null,
          diagnosisVerified: hasDisorder && randomBoolean(0.6),
          diagnosisVerifiedBy: hasDisorder && randomBoolean(0.6) ? "admin@hoep.org" : null,
          diagnosisVerifiedAt: hasDisorder && randomBoolean(0.6) ? faker.date.recent({ days: 30 }) : null,
        },
      });
      membershipCount++;
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Add one family with a DETACHED member (board-approved detachment scenario)
  // ══════════════════════════════════════════════════════════════════════════
  const detachPatient = patients[8];
  if (detachPatient) {
    const lastName = detachPatient.contactProfile?.lastName ?? "Family";

    const detachFamily = await prisma.family.create({
      data: {
        name: `${lastName} Family`,
        primaryPatientId: detachPatient.id,
      },
    });
    familyCount++;

    // Active adult member
    await prisma.familyMembership.create({
      data: {
        familyId: detachFamily.id,
        firstName: faker.person.firstName(),
        lastName,
        dateOfBirth: new Date("1998-05-12"),
        relationship: "sibling",
        ageTier: "ADULT",
        status: "ACTIVE",
        hasBleedingDisorder: false,
      },
    });
    membershipCount++;

    // Detached member (e.g. adult child who moved out and registered separately)
    const boardApproval = await prisma.boardApproval.create({
      data: {
        type: "FAMILY_DETACHMENT",
        status: "APPROVED",
        requestedBy: "admin@hoep.org",
        requestedAt: faker.date.recent({ days: 45 }),
        reviewedBy: "board@hoep.org",
        reviewedAt: faker.date.recent({ days: 30 }),
        notes: "Adult member requested independent registration.",
        resourceType: "FamilyMembership",
      },
    });

    await prisma.familyMembership.create({
      data: {
        familyId: detachFamily.id,
        firstName: faker.person.firstName(),
        lastName,
        dateOfBirth: new Date("1995-03-20"),
        relationship: "son",
        ageTier: "ADULT",
        status: "DETACHED",
        hasBleedingDisorder: true,
        disorderCondition: "Hemophilia_a",
        disorderSeverity: "moderate",
        diagnosisVerified: true,
        diagnosisVerifiedBy: "admin@hoep.org",
        diagnosisVerifiedAt: faker.date.recent({ days: 60 }),
        detachedAt: faker.date.recent({ days: 30 }),
        detachedBy: "admin@hoep.org",
        detachReason: "Registered as independent patient.",
        boardApprovalId: boardApproval.id,
      },
    });
    membershipCount++;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Create volunteer profiles for 5 patients
  // ══════════════════════════════════════════════════════════════════════════
  const volunteerPatients = patients.slice(10, 15);
  const volunteerStatuses = [
    "APPROVED",
    "APPROVED",
    "PENDING_REVIEW",
    "PENDING_REVIEW",
    "REJECTED",
  ] as const;
  let volunteerCount = 0;

  for (let i = 0; i < volunteerPatients.length; i++) {
    const patient = volunteerPatients[i];
    const status = volunteerStatuses[i];
    const requestedAt = faker.date.recent({ days: 120 });

    await prisma.patient.update({
      where: { id: patient.id },
      data: {
        wantsToVolunteer: true,
        volunteerRequestedAt: requestedAt,
      },
    });

    await prisma.volunteerProfile.create({
      data: {
        patientId: patient.id,
        status,
        approvedBy: status === "APPROVED" ? "admin@hoep.org" : null,
        approvedAt: status === "APPROVED" ? faker.date.recent({ days: 30 }) : null,
        rejectedBy: status === "REJECTED" ? "admin@hoep.org" : null,
        rejectedAt: status === "REJECTED" ? faker.date.recent({ days: 60 }) : null,
        rejectionReason:
          status === "REJECTED" ? "Availability does not align with event schedules." : null,
        internalNotes: status === "APPROVED" ? "Bilingual, reliable, great fit." : null,
        generalAvailability: { weekends: true, weekdayEvenings: randomBoolean(0.5) },
        skills: faker.helpers.arrayElements(
          ["bilingual", "event setup", "registration", "hospitality", "first aid"],
          randomInt(1, 3),
        ),
        applications: {
          create: {
            whyVolunteering:
              "I want to give back to the bleeding disorder community in El Paso.",
            skills: "Bilingual (English/Spanish), event coordination",
            availability: "Weekends and occasional evenings",
            priorExperience: randomBoolean(0.6)
              ? "Volunteered at community health fairs and local nonprofits."
              : null,
            submittedAt: requestedAt,
            reviewedBy: status !== "PENDING_REVIEW" ? "admin@hoep.org" : null,
            reviewedAt: status !== "PENDING_REVIEW" ? faker.date.recent({ days: 60 }) : null,
            reviewNotes:
              status === "APPROVED"
                ? "Excellent candidate. Approved."
                : status === "REJECTED"
                  ? "Availability does not match our needs at this time."
                  : null,
          },
        },
      },
    });
    volunteerCount++;
  }

  console.log(
    `✅ Created ${familyCount} families with ${membershipCount} memberships, and ${volunteerCount} volunteer profiles`,
  );
}
