import {
  prisma,
  pollTemplates,
  questionTemplates,
  announcementTemplates,
  itineraryTemplates,
  randomInt,
  randomItem,
  randomBoolean,
} from "../seed-utils";
import crypto from "crypto";

export async function seedEngagement() {
  console.log(
    "🌱 Seeding engagement data (polls, Q&A, announcements, itinerary)...",
  );

  const pastEvents = await prisma.event.findMany({
    where: {
      eventDate: {
        lt: new Date(),
      },
      status: "published",
    },
    include: {
      checkIns: {
        include: {
          patient: {
            include: {
              profile: true, // FIXED
            },
          },
        },
      },
    },
  });

  const admin = await prisma.patient.findFirst({
    where: { role: "admin" },
  });

  if (!admin) throw new Error("No admin found");

  let pollCount = 0;
  let questionCount = 0;
  let announcementCount = 0;
  let itineraryCount = 0;

  for (const event of pastEvents) {
    // Skip if no check-ins
    if (event.checkIns.length === 0) continue;

    // Create 1-2 polls per event
    const numPolls = randomInt(1, 2);
    for (let i = 0; i < numPolls; i++) {
      const template = pollTemplates[i % pollTemplates.length];

      const poll = await prisma.poll.create({
        data: {
          eventId: event.id,
          questionEn: template.questionEn,
          questionEs: template.questionEs,
          status: "approved",
          active: false, // Past events, polls are closed
          createdBy: admin.email,
        },
      });

      // Create poll options
      const optionIds = [];
      for (const optionTemplate of template.options) {
        const option = await prisma.pollOption.create({
          data: {
            pollId: poll.id,
            textEn: optionTemplate.textEn,
            textEs: optionTemplate.textEs,
          },
        });
        optionIds.push(option.id);
      }

      // 40-70% of attendees vote
      const voters = event.checkIns.slice(
        0,
        Math.floor(event.checkIns.length * (randomInt(40, 70) / 100)),
      );
      for (const checkIn of voters) {
        await prisma.pollResponse.create({
          data: {
            pollId: poll.id,
            sessionToken: checkIn.sessionToken,
            selectedOptionId: randomItem(optionIds),
          },
        });
      }

      pollCount++;
    }

    // Create 2-4 Q&A questions per event
    const numQuestions = randomInt(2, 4);
    for (let i = 0; i < numQuestions; i++) {
      const template = questionTemplates[i % questionTemplates.length];
      const asker = randomItem(event.checkIns);

      // 70% chance question is answered
      const isAnswered = randomBoolean(0.7);

      const question = await prisma.eventQuestion.create({
        data: {
          eventId: event.id,
          questionEn: template.questionEn,
          questionEs: template.questionEs,
          originalLang: randomItem(["en", "es"]),
          patientId: asker.patientId,
          patientName: `${asker.patient.profile?.firstName} ${asker.patient.profile?.lastName}`,
          isAnonymous: randomBoolean(0.3),
          sessionToken: asker.sessionToken,
          answered: isAnswered,
          answerEn: isAnswered ? template.answerEn : null,
          answerEs: isAnswered ? template.answerEs : null,
          answeredBy: isAnswered ? admin.email : null,
          answeredAt: isAnswered ? new Date(event.eventDate) : null,
          upvotes: randomInt(0, 15),
          upvotedBy: [], // Would need to track individual upvoters
        },
      });

      questionCount++;
    }

    // Create 1-3 announcements per event
    const numAnnouncements = randomInt(1, 3);
    for (let i = 0; i < numAnnouncements; i++) {
      const template = announcementTemplates[i % announcementTemplates.length];

      await prisma.eventAnnouncement.create({
        data: {
          eventId: event.id,
          messageEn: template.messageEn,
          messageEs: template.messageEs,
          priority: template.priority,
          active: false, // Past event
          createdBy: admin.email,
        },
      });

      announcementCount++;
    }

    // Create 4-6 itinerary items per event
    const numItems = randomInt(4, 6);
    const eventDate = new Date(event.eventDate);
    let currentTime = new Date(eventDate);

    for (let i = 0; i < numItems; i++) {
      const template = itineraryTemplates[i % itineraryTemplates.length];
      const duration = randomInt(30, 90);

      await prisma.eventItineraryItem.create({
        data: {
          eventId: event.id,
          titleEn: template.titleEn,
          titleEs: template.titleEs,
          descriptionEn: template.descriptionEn,
          descriptionEs: template.descriptionEs,
          startTime: new Date(currentTime),
          endTime: new Date(currentTime.getTime() + duration * 60 * 1000),
          duration,
          status: "completed",
          sequenceOrder: i,
          location: randomItem([
            "Main Hall",
            "Conference Room A",
            "Outdoor Area",
            "Cafeteria",
            null,
          ]),
          createdBy: admin.email,
        },
      });

      currentTime = new Date(currentTime.getTime() + duration * 60 * 1000);
      itineraryCount++;
    }
  }

  console.log(
    `✅ Created ${pollCount} polls, ${questionCount} questions, ${announcementCount} announcements, ${itineraryCount} itinerary items`,
  );
}
