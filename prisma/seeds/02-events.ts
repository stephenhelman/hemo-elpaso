import { faker } from "@faker-js/faker";
import {
  prisma,
  eventTemplates,
  randomInt,
  randomItem,
  randomDate,
  shuffleArray,
} from "../seed-utils";

export async function seedEvents() {
  console.log("🌱 Seeding events...");

  const now = new Date();
  const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
  const threeMonthsFuture = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

  const events = [];

  // Get admin user for createdBy
  const admin = await prisma.patient.findFirst({
    where: { role: "admin" },
  });

  if (!admin) {
    throw new Error("No admin user found. Run patient seed first.");
  }

  // Shuffle templates to randomize
  const shuffledTemplates = shuffleArray([...eventTemplates]);

  // Create 10 past events (last 6 months)
  for (let i = 0; i < 10; i++) {
    const template = shuffledTemplates[i % shuffledTemplates.length];
    const eventDate = randomDate(sixMonthsAgo, now);
    const rsvpDeadline = new Date(
      eventDate.getTime() - 7 * 24 * 60 * 60 * 1000,
    ); // 1 week before

    const event = await prisma.event.create({
      data: {
        titleEn: template.titleEn,
        titleEs: template.titleEs,
        descriptionEn: template.descriptionEn,
        descriptionEs: template.descriptionEs,
        slug: `${template.titleEn.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}-${i}`,
        eventDate,
        location: randomItem([
          "HOEP Community Center - 123 Main St, El Paso, TX 79901",
          "El Paso Convention Center - 1 Civic Center Plaza, El Paso, TX 79901",
          "Memorial Park - 1701 N Copia St, El Paso, TX 79903",
          "Las Cruces Community Center - 999 E New Mexico Ave, Las Cruces, NM 88001",
          "UTEP Union Building - 500 W University Ave, El Paso, TX 79968",
        ]),
        maxCapacity: randomItem([null, 50, 75, 100, 150, 200]),
        rsvpDeadline,
        status: "published",
        category: template.category,
        targetAudience: randomItem(["all", "adults", "children", "families"]),
        language: "both",
        isPriority: false,
        liveEnabled: true,
        createdBy: admin.email,
      },
    });

    events.push(event);
  }

  // Create 3 future events (next 3 months)
  for (let i = 10; i < 13; i++) {
    const template = shuffledTemplates[i % shuffledTemplates.length];
    const eventDate = randomDate(now, threeMonthsFuture);
    const rsvpDeadline = new Date(
      eventDate.getTime() - 7 * 24 * 60 * 60 * 1000,
    );

    const event = await prisma.event.create({
      data: {
        titleEn: template.titleEn,
        titleEs: template.titleEs,
        descriptionEn: template.descriptionEn,
        descriptionEs: template.descriptionEs,
        slug: `${template.titleEn.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}-${i}`,
        eventDate,
        location: randomItem([
          "HOEP Community Center - 123 Main St, El Paso, TX 79901",
          "El Paso Convention Center - 1 Civic Center Plaza, El Paso, TX 79901",
          "Memorial Park - 1701 N Copia St, El Paso, TX 79903",
        ]),
        maxCapacity: randomItem([null, 50, 75, 100, 150]),
        rsvpDeadline,
        status: "published",
        category: template.category,
        targetAudience: randomItem(["all", "adults", "children", "families"]),
        language: "both",
        isPriority: randomInt(0, 1) === 1,
        liveEnabled: true,
        createdBy: admin.email,
      },
    });

    events.push(event);
  }

  // Create 2 draft future events
  for (let i = 13; i < 15; i++) {
    const template = shuffledTemplates[i % shuffledTemplates.length];
    const eventDate = randomDate(now, threeMonthsFuture);

    const event = await prisma.event.create({
      data: {
        titleEn: template.titleEn + " (Draft)",
        titleEs: template.titleEs + " (Borrador)",
        descriptionEn: template.descriptionEn,
        descriptionEs: template.descriptionEs,
        slug: `${template.titleEn.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-draft-${Date.now()}-${i}`,
        eventDate,
        location: "TBD",
        maxCapacity: null,
        rsvpDeadline: null,
        status: "draft",
        category: template.category,
        targetAudience: "all",
        language: "both",
        isPriority: false,
        liveEnabled: false,
        createdBy: admin.email,
      },
    });

    events.push(event);
  }

  console.log(
    `✅ Created ${events.length} events (10 past, 3 future published, 2 drafts)`,
  );
  return events;
}
