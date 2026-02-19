import { prisma, randomInt, randomBoolean, randomItem } from "../seed-utils";
import crypto from "crypto";

export async function seedRsvpsAndCheckIns() {
  console.log("🌱 Seeding RSVPs and check-ins...");

  const patients = await prisma.patient.findMany({
    where: { role: "patient" },
    include: {
      profile: true,
    },
  });

  const events = await prisma.event.findMany({
    where: {
      status: "published",
    },
    orderBy: {
      eventDate: "asc",
    },
  });

  const admin = await prisma.patient.findFirst({
    where: { role: "admin" },
  });

  let rsvpCount = 0;
  let checkInCount = 0;

  // Determine if event is past or future
  const now = new Date();

  for (const event of events) {
    const isPastEvent = new Date(event.eventDate) < now;
    const isFutureEvent = !isPastEvent;

    // Shuffle patients to randomize who RSVPs
    const shuffledPatients = [...patients].sort(() => Math.random() - 0.5);

    // 60-80% of patients RSVP
    const rsvpRate = randomInt(60, 80) / 100;
    const numRsvps = Math.floor(shuffledPatients.length * rsvpRate);
    const rsvpedPatients = shuffledPatients.slice(0, numRsvps);

    for (const patient of rsvpedPatients) {
      // Create RSVP
      const rsvp = await prisma.rsvp.create({
        data: {
          eventId: event.id,
          patientId: patient.id,
          status: "confirmed",
          attendeeCount: randomInt(1, 4),
        },
      });
      rsvpCount++;

      // For past events, create check-ins (70-90% of RSVPs actually attend)
      if (isPastEvent && randomBoolean(randomInt(70, 90) / 100)) {
        const sessionToken = crypto.randomBytes(32).toString("hex");
        const sessionExpiresAt = new Date(
          new Date(event.eventDate).getTime() + 24 * 60 * 60 * 1000,
        );

        await prisma.checkIn.create({
          data: {
            eventId: event.id,
            patientId: patient.id,
            sessionToken,
            sessionExpiresAt,
            checkInTime: new Date(event.eventDate),
            checkedInBy: randomBoolean(0.7) ? admin?.email : null, // 70% manual, 30% QR
            attendeeRole: "patient",
          },
        });
        checkInCount++;
      }
    }

    // For past events, add some sponsors/donors/volunteers who checked in (didn't RSVP)
    if (isPastEvent) {
      const extraAttendees = randomInt(2, 5);
      const nonRsvpedPatients = shuffledPatients.slice(
        numRsvps,
        numRsvps + extraAttendees,
      );

      for (const patient of nonRsvpedPatients) {
        const sessionToken = crypto.randomBytes(32).toString("hex");
        const sessionExpiresAt = new Date(
          new Date(event.eventDate).getTime() + 24 * 60 * 60 * 1000,
        );

        await prisma.checkIn.create({
          data: {
            eventId: event.id,
            patientId: patient.id,
            sessionToken,
            sessionExpiresAt,
            checkInTime: new Date(event.eventDate),
            checkedInBy: admin?.email,
            attendeeRole: randomItem([
              "sponsor",
              "donor",
              "volunteer",
              "admin",
            ]),
          },
        });
        checkInCount++;
      }
    }
  }

  console.log(`✅ Created ${rsvpCount} RSVPs and ${checkInCount} check-ins`);
}
