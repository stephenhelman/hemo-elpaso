import { faker } from "@faker-js/faker";
import { prisma, randomInt, randomItem, randomBoolean } from "../seed-utils";
import crypto from "crypto";

const conditions = ["Hemophilia A", "Hemophilia B", "Von Willebrand Disease"];
const severities = ["Mild", "Moderate", "Severe"];

export async function seedPatients() {
  console.log("🌱 Seeding patients...");

  const patients = [];

  // Create 75 regular patients
  for (let i = 0; i < 75; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const email = faker.internet.email({ firstName, lastName }).toLowerCase();

    const patient = await prisma.patient.create({
      data: {
        auth0Id: `seed_${crypto.randomBytes(8).toString("hex")}`,
        email,
        role: "patient",
        profile: {
          create: {
            firstName,
            lastName,
            phone: faker.phone.number(),
            dateOfBirth: faker.date.birthdate({
              min: 1950,
              max: 2020,
              mode: "year",
            }),
            address: faker.location.streetAddress(),
            city: randomItem([
              "El Paso",
              "Las Cruces",
              "Socorro",
              "Anthony",
              "Sunland Park",
            ]),
            state: randomItem(["TX", "NM"]),
            zipCode: faker.location.zipCode(),
            primaryCondition: randomItem(conditions),
            severity: randomItem(severities),
            diagnosisDate: faker.date.past({ years: randomInt(1, 30) }),
            emergencyContactName: faker.person.fullName(),
            emergencyContactRelationship: randomItem([
              "Spouse",
              "Parent",
              "Sibling",
              "Friend",
            ]),
            emergencyContactPhone: faker.phone.number(),
            hipaaConsent: true,
            photoConsent: randomBoolean(0.8),
            communicationConsent: randomBoolean(0.9),
          },
        },
      },
      include: {
        profile: true,
      },
    });

    patients.push(patient);

    // 30% chance of having family members
    if (randomBoolean(0.3)) {
      const numFamilyMembers = randomInt(1, 3);
      for (let j = 0; j < numFamilyMembers; j++) {
        await prisma.familyMember.create({
          data: {
            patientId: patient.id,
            firstName: faker.person.firstName(),
            lastName: lastName, // Same last name
            relationship: randomItem(["Spouse", "Child", "Parent", "Sibling"]),
            dateOfBirth: faker.date.birthdate({
              min: 1940,
              max: 2020,
              mode: "year",
            }),
            hasBleedingDisorder: randomBoolean(0.2),
            condition: randomBoolean(0.2) ? randomItem(conditions) : null,
          },
        });
      }
    }
  }

  // Create 2 admin users
  await prisma.patient.create({
    data: {
      auth0Id: `seed_admin_1`,
      email: "admin@hoep.org",
      role: "admin",
      profile: {
        create: {
          firstName: "Admin",
          lastName: "User",
          phone: "915-555-0100",
          dateOfBirth: new Date("1985-01-01"),
          address: "123 Admin St",
          city: "El Paso",
          state: "TX",
          zipCode: "79901",
          primaryCondition: "N/A",
          severity: "N/A",
          diagnosisDate: new Date(),
          emergencyContactName: "Emergency Contact",
          emergencyContactRelationship: "Friend",
          emergencyContactPhone: "915-555-0101",
          hipaaConsent: true,
          photoConsent: true,
          communicationConsent: true,
        },
      },
    },
  });

  // Create 1 board member
  await prisma.patient.create({
    data: {
      auth0Id: `seed_board_1`,
      email: "board@hoep.org",
      role: "board",
      profile: {
        create: {
          firstName: "Board",
          lastName: "Member",
          phone: "915-555-0200",
          dateOfBirth: new Date("1975-01-01"),
          address: "456 Board Ave",
          city: "El Paso",
          state: "TX",
          zipCode: "79902",
          primaryCondition: "N/A",
          severity: "N/A",
          diagnosisDate: new Date(),
          emergencyContactName: "Emergency Contact",
          emergencyContactRelationship: "Spouse",
          emergencyContactPhone: "915-555-0201",
          hipaaConsent: true,
          photoConsent: true,
          communicationConsent: true,
        },
      },
    },
  });

  console.log(
    `✅ Created ${patients.length + 2} patients with profiles and family members`,
  );
  return patients;
}
