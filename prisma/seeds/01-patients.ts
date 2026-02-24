import { faker } from "@faker-js/faker";
import { prisma, randomInt, randomItem, randomBoolean } from "../seed-utils";
import crypto from "crypto";

const conditions = ["Hemophilia_a", "Hemophilia_b", "Von_Willebrand"];
const severities = ["mild", "moderate", "severe"];

export async function seedPatients() {
  console.log("🌱 Seeding patients...");

  const patients = [];

  // ══════════════════════════════════════════════════════════════════════════
  // Helper function to calculate migration eligibility (18 years from DOB)
  // ══════════════════════════════════════════════════════════════════════════
  const calculateMigrationEligibility = (dateOfBirth: Date): Date => {
    const eligibleDate = new Date(dateOfBirth);
    eligibleDate.setFullYear(eligibleDate.getFullYear() + 18);
    return eligibleDate;
  };

  // ══════════════════════════════════════════════════════════════════════════
  // Create 50 regular patients with various scenarios
  // ══════════════════════════════════════════════════════════════════════════
  for (let i = 0; i < 50; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const email = faker.internet.email({ firstName, lastName }).toLowerCase();
    const dateOfBirth = faker.date.birthdate({
      min: 1950,
      max: 1995,
      mode: "year",
    });

    // Determine if patient has bleeding disorder (60% chance)
    const patientHasCondition = randomBoolean(0.6);

    // Determine if family has disorders (30% chance)
    const familyHasCondition = randomBoolean(0.3);

    // Set grace period if either patient or family has condition
    const requiresGracePeriod = patientHasCondition || familyHasCondition;

    const patient = await prisma.patient.create({
      data: {
        auth0Id: `seed_${crypto.randomBytes(8).toString("hex")}`,
        email,
        role: "patient",
        preferredLanguage: randomItem(["en", "es"]),
        registrationCompletedAt: new Date(),
        consentDate: new Date(),
        consentToContact: true,
        consentToPhotos: randomBoolean(0.8),

        // Grace period (60 days if any condition)
        diagnosisGracePeriodEndsAt: requiresGracePeriod
          ? new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
          : null,
        diagnosisGracePeriodSource: patientHasCondition
          ? "self"
          : familyHasCondition
            ? "family"
            : null,

        // Emergency contact
        emergencyContactName: faker.person.fullName(),
        emergencyContactPhone: faker.phone.number(),
        emergencyContactRelationship: randomItem([
          "Spouse",
          "Parent",
          "Sibling",
          "Friend",
        ]),

        // Contact Profile (always exists)
        contactProfile: {
          create: {
            firstName,
            lastName,
            phone: faker.phone.number(),
            dateOfBirth,
            addressLine1: faker.location.streetAddress(),
            city: randomItem([
              "El Paso",
              "Las Cruces",
              "Socorro",
              "Anthony",
              "Sunland Park",
            ]),
            state: randomItem(["TX", "NM"]),
            zipCode: faker.location.zipCode(),
          },
        },

        // Disorder Profile (only if patient has condition)
        ...(patientHasCondition && {
          disorderProfile: {
            create: {
              condition: randomItem(conditions),
              severity: randomItem(severities),
              dateOfDiagnosis: faker.date.past({ years: randomInt(1, 30) }),
              treatingPhysician: `Dr. ${faker.person.lastName()}`,
              specialtyPharmacy: `${faker.company.name()} Specialty Pharmacy`,
              diagnosisVerified: randomBoolean(0.7), // 70% verified
              ...(randomBoolean(0.7) && {
                diagnosisVerifiedAt: new Date(),
                diagnosisVerifiedBy: "admin@hoep.org",
              }),
            },
          },
        }),

        // Preferences
        preferences: {
          create: {
            interestedTopics: faker.helpers.arrayElements(
              [
                "educational_dinner",
                "support_group",
                "family_event",
                "volunteer_opportunity",
              ],
              randomInt(1, 3),
            ),
            preferredEventTimes: faker.helpers.arrayElements(
              ["weekday_morning", "weekday_evening", "weekend_afternoon"],
              randomInt(1, 2),
            ),
            maxTravelDistance: randomInt(10, 50),
            dietaryRestrictions: randomBoolean(0.3)
              ? faker.helpers.arrayElements(
                  ["vegetarian", "gluten_free", "vegan", "dairy_free"],
                  randomInt(1, 2),
                )
              : [],
            emailNotifications: true,
            smsNotifications: randomBoolean(0.5),
          },
        },
      },
    });

    patients.push(patient);

    // ════════════════════════════════════════════════════════════════════════
    // Add family members (40% chance)
    // ════════════════════════════════════════════════════════════════════════
    if (randomBoolean(0.4)) {
      const numFamilyMembers = randomInt(1, 3);

      for (let j = 0; j < numFamilyMembers; j++) {
        const memberFirstName = faker.person.firstName();
        const memberDOB = faker.date.birthdate({
          min: 1940,
          max: 2020,
          mode: "year",
        });
        const memberHasCondition = familyHasCondition && randomBoolean(0.5); // 50% of family members have condition

        await prisma.familyMember.create({
          data: {
            patientId: patient.id,
            relationship: randomItem([
              "spouse",
              "son",
              "daughter",
              "parent",
              "sibling",
            ]),
            hasBleedingDisorder: memberHasCondition,
            migrationEligibleAt: calculateMigrationEligibility(memberDOB),

            // Contact info for family member
            contactProfile: {
              create: {
                firstName: memberFirstName,
                lastName,
                dateOfBirth: memberDOB,
              },
            },

            // Disorder profile (only if has condition)
            ...(memberHasCondition && {
              disorderProfile: {
                create: {
                  condition: randomItem(conditions),
                  severity: randomItem(severities),
                  dateOfDiagnosis: faker.date.past({ years: randomInt(1, 20) }),
                  treatingPhysician: `Dr. ${faker.person.lastName()}`,
                  specialtyPharmacy: `${faker.company.name()} Specialty Pharmacy`,
                  diagnosisVerified: randomBoolean(0.5), // 50% verified
                },
              },
            }),
          },
        });
      }
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Create Admin User
  // ══════════════════════════════════════════════════════════════════════════
  await prisma.patient.create({
    data: {
      auth0Id: "seed_admin_1",
      email: "admin@hoep.org",
      role: "admin",
      preferredLanguage: "en",
      registrationCompletedAt: new Date(),
      consentDate: new Date(),
      consentToContact: true,
      consentToPhotos: true,

      emergencyContactName: "Emergency Contact",
      emergencyContactPhone: "915-555-0101",
      emergencyContactRelationship: "Friend",

      contactProfile: {
        create: {
          firstName: "Admin",
          lastName: "User",
          phone: "915-555-0100",
          dateOfBirth: new Date("1985-01-01"),
          addressLine1: "123 Admin St",
          city: "El Paso",
          state: "TX",
          zipCode: "79901",
        },
      },

      preferences: {
        create: {
          interestedTopics: [],
          preferredEventTimes: [],
          maxTravelDistance: 30,
          dietaryRestrictions: [],
          emailNotifications: true,
          smsNotifications: false,
        },
      },
    },
  });

  // ══════════════════════════════════════════════════════════════════════════
  // Create Board Member
  // ══════════════════════════════════════════════════════════════════════════
  await prisma.patient.create({
    data: {
      auth0Id: "seed_board_1",
      email: "board@hoep.org",
      role: "board",
      preferredLanguage: "en",
      registrationCompletedAt: new Date(),
      consentDate: new Date(),
      consentToContact: true,
      consentToPhotos: true,

      emergencyContactName: "Emergency Contact",
      emergencyContactPhone: "915-555-0201",
      emergencyContactRelationship: "Spouse",

      contactProfile: {
        create: {
          firstName: "Board",
          lastName: "Member",
          phone: "915-555-0200",
          dateOfBirth: new Date("1975-01-01"),
          addressLine1: "456 Board Ave",
          city: "El Paso",
          state: "TX",
          zipCode: "79902",
        },
      },

      preferences: {
        create: {
          interestedTopics: [],
          preferredEventTimes: [],
          maxTravelDistance: 30,
          dietaryRestrictions: [],
          emailNotifications: true,
          smsNotifications: false,
        },
      },
    },
  });

  // ══════════════════════════════════════════════════════════════════════════
  // Create Your Personal Admin Account
  // ══════════════════════════════════════════════════════════════════════════
  await prisma.patient.create({
    data: {
      auth0Id: "google-oauth2|108328322650777067680", // Your real Auth0 ID
      email: "stephenhelman18@gmail.com",
      role: "admin",
      preferredLanguage: "en",
      registrationCompletedAt: new Date(),
      consentDate: new Date(),
      consentToContact: true,
      consentToPhotos: true,

      emergencyContactName: "Personal Contact",
      emergencyContactPhone: "915-555-9999",
      emergencyContactRelationship: "Family",

      contactProfile: {
        create: {
          firstName: "Stephen",
          lastName: "Helman",
          phone: "915-555-ADMIN",
          dateOfBirth: new Date("1990-01-01"),
          addressLine1: "123 Dev St",
          city: "El Paso",
          state: "TX",
          zipCode: "79901",
        },
      },

      preferences: {
        create: {
          interestedTopics: [],
          preferredEventTimes: [],
          maxTravelDistance: 30,
          dietaryRestrictions: [],
          emailNotifications: true,
          smsNotifications: false,
        },
      },
    },
  });

  console.log(
    `✅ Created ${patients.length + 3} patients (50 regular + 3 staff) with contact profiles, disorder profiles where applicable, and family members`,
  );
  return patients;
}
