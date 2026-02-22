import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

// Pre-translated event content (no DeepL needed)
export const eventTemplates = [
  {
    titleEn: "Family Fun Day",
    titleEs: "Día de Diversión Familiar",
    descriptionEn:
      "Join us for a day of games, activities, and quality family time. Enjoy food, entertainment, and connect with other families in our community.",
    descriptionEs:
      "Únase a nosotros para un día de juegos, actividades y tiempo de calidad en familia. Disfrute de comida, entretenimiento y conéctese con otras familias de nuestra comunidad.",
    category: "SOCIAL",
  },
  {
    titleEn: "Hemophilia Education Workshop",
    titleEs: "Taller Educativo sobre Hemofilia",
    descriptionEn:
      "Learn about the latest treatments, management strategies, and resources available for hemophilia patients and their families.",
    descriptionEs:
      "Aprenda sobre los últimos tratamientos, estrategias de manejo y recursos disponibles para pacientes con hemofilia y sus familias.",
    category: "EDUCATION",
  },
  {
    titleEn: "Annual Fundraiser Gala",
    titleEs: "Gala Anual de Recaudación de Fondos",
    descriptionEn:
      "Support HOEP at our annual fundraising event featuring dinner, live music, silent auction, and inspiring stories from our community.",
    descriptionEs:
      "Apoye a HOEP en nuestro evento anual de recaudación de fondos con cena, música en vivo, subasta silenciosa e historias inspiradoras de nuestra comunidad.",
    category: "FUNDRAISING",
  },
  {
    titleEn: "Back to School Prep",
    titleEs: "Preparación para el Regreso a Clases",
    descriptionEn:
      "Get ready for the school year with backpacks, supplies, and resources to help your child succeed in the classroom.",
    descriptionEs:
      "Prepárese para el año escolar con mochilas, útiles y recursos para ayudar a su hijo a tener éxito en el aula.",
    category: "FAMILY_SUPPORT",
  },
  {
    titleEn: "Holiday Celebration",
    titleEs: "Celebración de Fiestas",
    descriptionEn:
      "Celebrate the holiday season with our community! Enjoy festive activities, gifts for children, and a special visit from Santa.",
    descriptionEs:
      "¡Celebre la temporada navideña con nuestra comunidad! Disfrute de actividades festivas, regalos para niños y una visita especial de Santa Claus.",
    category: "SOCIAL",
  },
  {
    titleEn: "Mental Health Support Group",
    titleEs: "Grupo de Apoyo de Salud Mental",
    descriptionEn:
      "A safe space to discuss challenges, share experiences, and receive support from others who understand living with hemophilia.",
    descriptionEs:
      "Un espacio seguro para discutir desafíos, compartir experiencias y recibir apoyo de otros que entienden vivir con hemofilia.",
    category: "FAMILY_SUPPORT",
  },
  {
    titleEn: "Sports & Recreation Day",
    titleEs: "Día de Deportes y Recreación",
    descriptionEn:
      "Participate in adapted sports activities designed for people with bleeding disorders. Learn safe ways to stay active and healthy.",
    descriptionEs:
      "Participe en actividades deportivas adaptadas para personas con trastornos hemorrágicos. Aprenda formas seguras de mantenerse activo y saludable.",
    category: "SOCIAL",
  },
  {
    titleEn: "Career Development Workshop",
    titleEs: "Taller de Desarrollo Profesional",
    descriptionEn:
      "Build job skills, learn about workplace rights, and connect with potential employers who value diversity and inclusion.",
    descriptionEs:
      "Desarrolle habilidades laborales, aprenda sobre los derechos en el lugar de trabajo y conéctese con empleadores potenciales que valoran la diversidad e inclusión.",
    category: "EDUCATION",
  },
  {
    titleEn: "Summer Camp Kickoff",
    titleEs: "Inicio del Campamento de Verano",
    descriptionEn:
      "Get excited for summer camp! Meet counselors, learn about activities, and prepare for an unforgettable summer experience.",
    descriptionEs:
      "¡Prepárese para el campamento de verano! Conozca a los consejeros, aprenda sobre las actividades y prepárese para una experiencia de verano inolvidable.",
    category: "SOCIAL",
  },
  {
    titleEn: "Financial Planning Seminar",
    titleEs: "Seminario de Planificación Financiera",
    descriptionEn:
      "Learn about managing medical expenses, insurance navigation, and financial resources available to families affected by hemophilia.",
    descriptionEs:
      "Aprenda sobre el manejo de gastos médicos, navegación de seguros y recursos financieros disponibles para familias afectadas por hemofilia.",
    category: "EDUCATIONAL",
  },
];

// Pre-translated poll questions
export const pollTemplates = [
  {
    questionEn: "What topic interests you most?",
    questionEs: "¿Qué tema le interesa más?",
    options: [
      { textEn: "Treatment Options", textEs: "Opciones de Tratamiento" },
      { textEn: "Mental Health", textEs: "Salud Mental" },
      { textEn: "Financial Planning", textEs: "Planificación Financiera" },
      { textEn: "Recreation & Sports", textEs: "Recreación y Deportes" },
    ],
  },
  {
    questionEn: "Preferred event time?",
    questionEs: "¿Hora preferida del evento?",
    options: [
      { textEn: "Morning (9am-12pm)", textEs: "Mañana (9am-12pm)" },
      { textEn: "Afternoon (1pm-4pm)", textEs: "Tarde (1pm-4pm)" },
      { textEn: "Evening (5pm-8pm)", textEs: "Noche (5pm-8pm)" },
      { textEn: "Weekend All Day", textEs: "Fin de Semana Todo el Día" },
    ],
  },
  {
    questionEn: "How did you hear about this event?",
    questionEs: "¿Cómo se enteró de este evento?",
    options: [
      { textEn: "Email Newsletter", textEs: "Boletín por Correo Electrónico" },
      { textEn: "Social Media", textEs: "Redes Sociales" },
      { textEn: "Friend/Family", textEs: "Amigo/Familia" },
      { textEn: "HOEP Staff", textEs: "Personal de HOEP" },
    ],
  },
];

// Pre-translated Q&A questions
export const questionTemplates = [
  {
    questionEn: "What financial assistance programs are available?",
    questionEs: "¿Qué programas de asistencia financiera están disponibles?",
    answerEn:
      "We offer several programs including medication assistance, transportation vouchers, and emergency financial aid. Contact our office for a complete list and application details.",
    answerEs:
      "Ofrecemos varios programas que incluyen asistencia con medicamentos, vales de transporte y ayuda financiera de emergencia. Contacte nuestra oficina para obtener una lista completa y detalles de la aplicación.",
  },
  {
    questionEn: "Are siblings welcome at family events?",
    questionEs: "¿Son bienvenidos los hermanos en los eventos familiares?",
    answerEn:
      "Yes! We encourage the whole family to attend. Siblings are welcome at all family-oriented events and we have activities planned for all ages.",
    answerEs:
      "¡Sí! Alentamos a toda la familia a asistir. Los hermanos son bienvenidos en todos los eventos orientados a la familia y tenemos actividades planificadas para todas las edades.",
  },
  {
    questionEn: "How can I get involved as a volunteer?",
    questionEs: "¿Cómo puedo involucrarme como voluntario?",
    answerEn:
      "We'd love to have you volunteer! Please fill out our volunteer application on the website or call our office. We have opportunities for event support, administrative help, and peer mentoring.",
    answerEs:
      "¡Nos encantaría que sea voluntario! Complete nuestra solicitud de voluntariado en el sitio web o llame a nuestra oficina. Tenemos oportunidades de apoyo en eventos, ayuda administrativa y tutoría entre pares.",
  },
];

// Pre-translated announcements
export const announcementTemplates = [
  {
    messageEn: "Lunch will be served in 15 minutes in the main hall.",
    messageEs: "El almuerzo se servirá en 15 minutos en el salón principal.",
    priority: "normal",
  },
  {
    messageEn: "Please move to the conference room for the next presentation.",
    messageEs:
      "Por favor diríjase a la sala de conferencias para la próxima presentación.",
    priority: "normal",
  },
  {
    messageEn:
      "Raffle drawing will begin in 10 minutes! Make sure you have your tickets.",
    messageEs:
      "¡El sorteo de la rifa comenzará en 10 minutos! Asegúrese de tener sus boletos.",
    priority: "urgent",
  },
  {
    messageEn: "Restrooms are located near the main entrance.",
    messageEs: "Los baños están ubicados cerca de la entrada principal.",
    priority: "info",
  },
];

// Pre-translated itinerary items
export const itineraryTemplates = [
  {
    titleEn: "Registration & Welcome",
    titleEs: "Registro y Bienvenida",
    descriptionEn:
      "Check in at the front desk and receive your name tag and event materials.",
    descriptionEs:
      "Regístrese en la recepción y reciba su gafete y materiales del evento.",
  },
  {
    titleEn: "Opening Remarks",
    titleEs: "Comentarios de Apertura",
    descriptionEn: "Welcome message from HOEP leadership and event overview.",
    descriptionEs:
      "Mensaje de bienvenida del liderazgo de HOEP y resumen del evento.",
  },
  {
    titleEn: "Main Presentation",
    titleEs: "Presentación Principal",
    descriptionEn: "Featured speaker presentation on today's topic.",
    descriptionEs: "Presentación del orador destacado sobre el tema de hoy.",
  },
  {
    titleEn: "Lunch Break",
    titleEs: "Receso para Almorzar",
    descriptionEn: "Enjoy lunch and network with other attendees.",
    descriptionEs: "Disfrute del almuerzo y conéctese con otros asistentes.",
  },
  {
    titleEn: "Q&A Session",
    titleEs: "Sesión de Preguntas y Respuestas",
    descriptionEn: "Ask questions and engage with our speakers.",
    descriptionEs: "Haga preguntas e interactúe con nuestros oradores.",
  },
  {
    titleEn: "Closing & Raffle",
    titleEs: "Cierre y Sorteo",
    descriptionEn: "Final remarks and raffle prize drawing.",
    descriptionEs: "Comentarios finales y sorteo de premios.",
  },
];

// Utility functions
export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randomItem<T>(array: T[]): T {
  return array[randomInt(0, array.length - 1)];
}

export function randomBoolean(probability: number = 0.5): boolean {
  return Math.random() < probability;
}

export function randomDate(start: Date, end: Date): Date {
  return new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime()),
  );
}

export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
