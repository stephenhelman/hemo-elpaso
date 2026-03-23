import { seedPatients } from "./seeds/01-patients";
import { seedEvents } from "./seeds/02-events";
import { seedRsvpsAndCheckIns } from "./seeds/03-rsvps-checkins";
import { seedEngagement } from "./seeds/04-engagement";
import { seedFamiliesAndVolunteers } from "./seeds/05-families";
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

    // Step 3: Seed Families and Volunteer Profiles (must run before RSVPs)
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    await seedFamiliesAndVolunteers();
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    // Step 4: Seed RSVPs and Check-Ins
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    await seedRsvpsAndCheckIns();
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    // Step 5: Seed Engagement Data
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    await seedEngagement();
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    await seedEmailTemplates();

    console.log("✅ Database seeding completed successfully!");

    // Print summary
    const patientCount = await prisma.patient.count();
    const eventCount = await prisma.event.count();
    const familyCount = await prisma.family.count();
    const membershipCount = await prisma.familyMembership.count();
    const volunteerCount = await prisma.volunteerProfile.count();
    const rsvpCount = await prisma.rsvp.count();
    const checkInCount = await prisma.checkIn.count();
    const pollCount = await prisma.poll.count();
    const questionCount = await prisma.eventQuestion.count();

    console.log("\n📊 Seeding Summary:");
    console.log(`   Patients: ${patientCount}`);
    console.log(`   Events: ${eventCount}`);
    console.log(`   Families: ${familyCount}`);
    console.log(`   Family Memberships: ${membershipCount}`);
    console.log(`   Volunteer Profiles: ${volunteerCount}`);
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
