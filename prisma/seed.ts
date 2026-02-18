import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const pool = new Pool({
  connectionString,
  ssl: false,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database...");

  // Create events
  const events = [
    {
      slug: "spring-educational-dinner-2026",
      titleEn: "Spring Educational Dinner 2026",
      titleEs: "Cena Educativa de Primavera 2026",
      descriptionEn:
        "Join us for our annual Spring Educational Dinner featuring guest speakers from UMC El Paso and the National Hemophilia Foundation. Learn about the latest treatment advances, connect with other families, and enjoy a catered meal. This event is free for all registered families.",
      descriptionEs:
        "Únase a nosotros para nuestra Cena Educativa Anual de Primavera con oradores invitados de UMC El Paso y la Fundación Nacional de Hemofilia. Aprenda sobre los últimos avances en tratamiento, conéctese con otras familias y disfrute de una comida con catering. Este evento es gratuito para todas las familias registradas.",
      eventDate: new Date("2026-04-15T18:00:00"),
      location: "UMC El Paso Conference Center, 4815 Alameda Ave",
      maxCapacity: 150,
      rsvpDeadline: new Date("2026-04-08T23:59:59"),
      status: "published",
      category: "EDUCATION",
      targetAudience: "all",
      language: "both",
      isPriority: true,
    },
    {
      slug: "family-support-workshop-march-2026",
      titleEn: "Family Support Workshop - Navigating Insurance",
      titleEs: "Taller de Apoyo Familiar - Navegando el Seguro",
      descriptionEn:
        "A workshop designed to help families understand insurance coverage, appeals processes, and financial assistance programs. Bring your questions and connect with others facing similar challenges. Light refreshments provided.",
      descriptionEs:
        "Un taller diseñado para ayudar a las familias a comprender la cobertura de seguro, los procesos de apelaciones y los programas de asistencia financiera. Traiga sus preguntas y conéctese con otros que enfrentan desafíos similares. Se proporcionarán refrigerios ligeros.",
      eventDate: new Date("2026-03-20T10:00:00"),
      location: "HOEP Community Center, El Paso, TX",
      maxCapacity: 40,
      rsvpDeadline: new Date("2026-03-15T23:59:59"),
      status: "published",
      category: "FAMILY_SUPPORT",
      targetAudience: "adults",
      language: "both",
      isPriority: false,
    },
    {
      slug: "kids-summer-camp-info-session-2026",
      titleEn: "Kids Summer Camp Information Session",
      titleEs: "Sesión Informativa del Campamento de Verano para Niños",
      descriptionEn:
        "Learn about Camp Bold Eagle, our week-long summer camp for children ages 6-17 with bleeding disorders. Meet camp counselors, see photos from previous years, and register your child for summer 2026.",
      descriptionEs:
        "Aprenda sobre Camp Bold Eagle, nuestro campamento de verano de una semana para niños de 6 a 17 años con trastornos hemorrágicos. Conozca a los consejeros del campamento, vea fotos de años anteriores y registre a su hijo para el verano de 2026.",
      eventDate: new Date("2026-05-10T14:00:00"),
      location: "Online via Zoom",
      maxCapacity: 100,
      rsvpDeadline: new Date("2026-05-08T23:59:59"),
      status: "published",
      category: "YOUTH",
      targetAudience: "families",
      language: "both",
      isPriority: true,
    },
    {
      slug: "annual-fundraiser-gala-2026",
      titleEn: "Annual Fundraiser Gala 2026",
      titleEs: "Gala Anual de Recaudación de Fondos 2026",
      descriptionEn:
        "Our biggest event of the year! Join us for an elegant evening of dinner, dancing, silent auction, and community celebration. All proceeds support HOEP programs and services. Formal attire requested.",
      descriptionEs:
        "¡Nuestro evento más grande del año! Únase a nosotros para una elegante velada de cena, baile, subasta silenciosa y celebración comunitaria. Todos los ingresos apoyan los programas y servicios de HOEP. Se solicita vestimenta formal.",
      eventDate: new Date("2026-06-20T18:00:00"),
      location: "El Paso Convention Center, 1 Civic Center Plaza",
      maxCapacity: 300,
      rsvpDeadline: new Date("2026-06-10T23:59:59"),
      status: "published",
      category: "FUNDRAISING",
      targetAudience: "all",
      language: "both",
      isPriority: true,
    },
    {
      slug: "medical-update-seminar-feb-2026",
      titleEn: "Medical Update Seminar - Gene Therapy",
      titleEs: "Seminario de Actualización Médica - Terapia Génica",
      descriptionEn:
        "Dr. Maria Rodriguez from Texas Tech HSC El Paso presents the latest research on gene therapy for hemophilia. Q&A session included. CME credits available for healthcare providers.",
      descriptionEs:
        "La Dra. Maria Rodriguez de Texas Tech HSC El Paso presenta la última investigación sobre terapia génica para la hemofilia. Sesión de preguntas y respuestas incluida. Créditos CME disponibles para proveedores de atención médica.",
      eventDate: new Date("2026-02-28T19:00:00"),
      location: "Texas Tech HSC El Paso, 5001 El Paso Dr",
      maxCapacity: 80,
      rsvpDeadline: new Date("2026-02-25T23:59:59"),
      status: "published",
      category: "MEDICAL_UPDATE",
      targetAudience: "adults",
      language: "en",
      isPriority: false,
    },
  ];

  for (const eventData of events) {
    const event = await prisma.event.create({
      data: {
        ...eventData,
        targeting: {
          create: {
            targetConditions: [
              "hemophilia_a",
              "hemophilia_b",
              "von_willebrand",
            ],
            targetSeverity: ["mild", "moderate", "severe"],
            targetAgeGroups: ["children", "teens", "adults"],
            targetInterests: [],
          },
        },
      },
    });
    console.log(`✅ Created event: ${event.titleEn}`);
  }

  console.log("🎉 Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
