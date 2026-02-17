import { Event } from "@/types";

export const placeholderEvents: Event[] = [
  {
    id: "1",
    slug: "spring-educational-dinner-2025",
    titleEn: "Spring Educational Dinner",
    titleEs: "Cena Educativa de Primavera",
    descriptionEn:
      "Join us for our quarterly educational dinner featuring guest speakers from University Medical Center discussing the latest advances in hemophilia treatment. Dinner provided. Open to all families affected by bleeding disorders.",
    descriptionEs:
      "Únase a nosotros para nuestra cena educativa trimestral con oradores invitados del Centro Médico Universitario que discutirán los últimos avances en el tratamiento de la hemofilia. Cena incluida. Abierto a todas las familias afectadas por trastornos hemorrágicos.",
    eventDate: "2025-03-15T18:00:00",
    location: "El Paso Community Center, 325 N. Eucalyptus Dr, El Paso, TX",
    maxAttendees: 80,
    rsvpDeadline: "2025-03-10T23:59:00",
    status: "published",
    targeting: {
      targetConditions: ["hemophilia_a", "hemophilia_b"],
      targetSeverity: ["moderate", "severe"],
      targetAgeGroups: ["adults", "teens"],
      targetInterests: ["education"],
    },
  },
  {
    id: "2",
    slug: "family-support-workshop-2025",
    titleEn: "Family Support Workshop",
    titleEs: "Taller de Apoyo Familiar",
    descriptionEn:
      "A hands-on workshop designed for families navigating life with bleeding disorders. Topics include insurance navigation, school accommodations, and emotional support resources. Light refreshments provided.",
    descriptionEs:
      "Un taller práctico diseñado para familias que navegan la vida con trastornos hemorrágicos. Los temas incluyen navegación de seguros, adaptaciones escolares y recursos de apoyo emocional. Se proporcionarán refrigerios.",
    eventDate: "2025-04-05T10:00:00",
    location: "HOEP Office, El Paso, TX",
    maxAttendees: 40,
    rsvpDeadline: "2025-04-01T23:59:00",
    status: "published",
    targeting: {
      targetConditions: ["hemophilia_a", "hemophilia_b", "von_willebrand"],
      targetSeverity: ["mild", "moderate", "severe"],
      targetAgeGroups: ["adults"],
      targetInterests: ["education", "social"],
    },
  },
  {
    id: "3",
    slug: "annual-fundraiser-gala-2025",
    titleEn: "Annual Fundraiser Gala",
    titleEs: "Gala Anual de Recaudación de Fondos",
    descriptionEn:
      "Our annual fundraiser gala celebrating 30+ years of service to the El Paso bleeding disorders community. An evening of dinner, entertainment, and community. All proceeds benefit HOEP programs and services.",
    descriptionEs:
      "Nuestra gala anual de recaudación de fondos celebra más de 30 años de servicio a la comunidad de trastornos hemorrágicos de El Paso. Una noche de cena, entretenimiento y comunidad. Todos los ingresos benefician los programas y servicios de HOEP.",
    eventDate: "2025-05-20T18:30:00",
    location: "Hotel Paso del Norte, 101 S El Paso St, El Paso, TX",
    maxAttendees: 150,
    rsvpDeadline: "2025-05-15T23:59:00",
    status: "published",
    targeting: {
      targetConditions: ["hemophilia_a", "hemophilia_b", "von_willebrand"],
      targetSeverity: ["mild", "moderate", "severe"],
      targetAgeGroups: ["adults", "teens", "children"],
      targetInterests: ["social", "advocacy"],
    },
  },
  {
    id: "4",
    slug: "kids-summer-camp-info-2025",
    titleEn: "Kids Summer Camp Information Night",
    titleEs: "Noche de Información del Campamento de Verano",
    descriptionEn:
      "Learn about summer camp opportunities specifically designed for children with bleeding disorders. Representatives from Camp Bold Eagle will be on hand to answer questions. Open to families with children ages 6-17.",
    descriptionEs:
      "Conozca las oportunidades de campamento de verano diseñadas específicamente para niños con trastornos hemorrágicos. Representantes del Campamento Bold Eagle estarán disponibles para responder preguntas. Abierto a familias con niños de 6 a 17 años.",
    eventDate: "2025-06-10T18:00:00",
    location: "El Paso Public Library, 501 N Oregon St, El Paso, TX",
    maxAttendees: 60,
    rsvpDeadline: "2025-06-07T23:59:00",
    status: "published",
    targeting: {
      targetConditions: ["hemophilia_a", "hemophilia_b", "von_willebrand"],
      targetSeverity: ["mild", "moderate", "severe"],
      targetAgeGroups: ["children", "teens"],
      targetInterests: ["education", "social"],
    },
  },
  {
    id: "5",
    slug: "holiday-family-celebration-2024",
    titleEn: "Holiday Family Celebration",
    titleEs: "Celebración Familiar de Navidad",
    descriptionEn:
      "Our annual holiday celebration bringing the HOEP community together for an evening of food, fun, and family. Santa will be making a special appearance for the kids!",
    descriptionEs:
      "Nuestra celebración navideña anual reúne a la comunidad HOEP para una noche de comida, diversión y familia. ¡Santa Claus hará una aparición especial para los niños!",
    eventDate: "2024-12-14T17:00:00",
    location: "El Paso Community Center, 325 N. Eucalyptus Dr, El Paso, TX",
    maxAttendees: 120,
    status: "completed",
    targeting: {
      targetConditions: ["hemophilia_a", "hemophilia_b", "von_willebrand"],
      targetSeverity: ["mild", "moderate", "severe"],
      targetAgeGroups: ["adults", "teens", "children"],
      targetInterests: ["social"],
    },
  },
  {
    id: "6",
    slug: "fall-educational-seminar-2024",
    titleEn: "Fall Educational Seminar",
    titleEs: "Seminario Educativo de Otoño",
    descriptionEn:
      "A deep dive into the latest research on Von Willebrand Disease featuring Dr. Maria Rodriguez from Texas Tech University Health Sciences Center El Paso.",
    descriptionEs:
      "Una inmersión profunda en la última investigación sobre la enfermedad de Von Willebrand con la Dra. Maria Rodriguez del Centro de Ciencias de la Salud de Texas Tech University en El Paso.",
    eventDate: "2024-10-19T10:00:00",
    location: "Texas Tech HSC El Paso, 5001 El Paso Dr, El Paso, TX",
    maxAttendees: 75,
    status: "completed",
    targeting: {
      targetConditions: ["von_willebrand"],
      targetSeverity: ["mild", "moderate", "severe"],
      targetAgeGroups: ["adults"],
      targetInterests: ["education"],
    },
  },
];

export const upcomingEvents = placeholderEvents.filter(
  (e) => e.status === "published",
);

export const pastEvents = placeholderEvents.filter(
  (e) => e.status === "completed",
);

export function getEventBySlug(slug: string) {
  return placeholderEvents.find((e) => e.slug === slug);
}
