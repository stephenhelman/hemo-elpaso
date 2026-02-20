import { seedPatients } from "./seeds/01-patients";
import { seedEvents } from "./seeds/02-events";
import { seedRsvpsAndCheckIns } from "./seeds/03-rsvps-checkins";
import { seedEngagement } from "./seeds/04-engagement";
import { prisma } from "./seed-utils";
import { seedEmailTemplates } from "./seeds/email-templates";

async function main() {
  console.log("🌱 Starting database seeding...\n");

  try {
    // Step 1: Seed Patients
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    await seedPatients();
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    // Step 2: Seed Events
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    await seedEvents();
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    // Step 3: Seed RSVPs and Check-Ins
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    await seedRsvpsAndCheckIns();
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    // Step 4: Seed Engagement Data
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    await seedEngagement();
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    await seedEmailTemplates();

    console.log("✅ Database seeding completed successfully!");

    // Print summary
    const patientCount = await prisma.patient.count();
    const eventCount = await prisma.event.count();
    const rsvpCount = await prisma.rsvp.count();
    const checkInCount = await prisma.checkIn.count();
    const pollCount = await prisma.poll.count();
    const questionCount = await prisma.eventQuestion.count();

    console.log("\n📊 Seeding Summary:");
    console.log(`   Patients: ${patientCount}`);
    console.log(`   Events: ${eventCount}`);
    console.log(`   RSVPs: ${rsvpCount}`);
    console.log(`   Check-Ins: ${checkInCount}`);
    console.log(`   Polls: ${pollCount}`);
    console.log(`   Questions: ${questionCount}`);
    console.log("\n🎉 Your database is ready for testing!");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    throw error;
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
