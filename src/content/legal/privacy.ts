import { LEGAL_EFFECTIVE_DATE } from "./meta";
import type { LegalDoc } from "./types";

/**
 * Privacy Policy v1. English wording is the board-approved text (docs/legal/POLICIES_v1.md) and controls.
 * Spanish is a working translation awaiting native-speaker review (docs/overhaul/ES_REVIEW.md, "Legal pages").
 * Never edit a published version in place: add privacy v2 and keep this one.
 */
export const privacy: LegalDoc = {
  version: "1",
  effectiveDate: LEGAL_EFFECTIVE_DATE,
  en: {
    title: "Privacy Policy",
    blocks: [
      {
        t: "p",
        text: "Hemophilia Outreach of El Paso (HOEP) is a nonprofit that supports families affected by bleeding disorders in the El Paso area. This policy explains what information we collect through our website and events, why, who can see it, how long we keep it, and the choices you have. We never sell your information.",
      },
      { t: "h2", text: "Information we collect" },
      { t: "p", text: "**When you register your household:**" },
      {
        t: "ul",
        items: [
          "Your name, email address and/or phone number, and preferred language (English or Spanish).",
          "Your mailing address, if you choose to give it.",
          "The people in your household: first name (last name optional), relationship to you, and age group. We do not ask for dates of birth.",
          "If you choose to tell us, whether you or a child in your household has a bleeding disorder, and which one (for example, hemophilia A, hemophilia B, or von Willebrand disease). This is health information, and we treat it with extra care.",
          "Your consents and when you gave them (see “Your consents” below).",
        ],
      },
      {
        t: "p",
        text: "**Adults in your household** are asked to confirm their own information. If you list someone 18 or older, we email them once with a private link, or call them if they have no email. They decide for themselves whether to share health information and whether to consent. If they don’t confirm within 30 days, we delete what you entered about them, except a note that your household includes one more adult.",
      },
      {
        t: "p",
        text: "**When you RSVP or attend an event:** who in your household is coming, the number of guests, and who checked in.",
      },
      {
        t: "p",
        text: "**When you contact us:** your name, email, phone (optional), and your message. Contact-form messages are sent to HOEP’s email inbox and are not stored in our database. Please don’t include medical details in a contact message; we will follow up privately.",
      },
      {
        t: "p",
        text: "**When you visit the website:** we use privacy-friendly page-view statistics that do not use cookies or identify you. We store one cookie to remember your language choice. Our hosting provider sees standard technical information, such as your IP address, to deliver the site.",
      },
      {
        t: "p",
        text: "**Photos:** HOEP may take photos at events. Photos are only published for people who consented to photo use (see below).",
      },
      { t: "h2", text: "How we use it" },
      {
        t: "ul",
        items: [
          "To invite you to events. Some events are for specific groups, such as families affected by a particular condition or children of a certain age, so we may use your household’s information to decide which invitations to send you. Invitations never say why you were invited or mention anyone’s diagnosis.",
          "To manage RSVPs, send confirmations and reminders, and check people in at events.",
          "To answer your messages.",
          "To improve our programs, using overall counts (for example, how many families attended).",
        ],
      },
      {
        t: "p",
        text: "We do not use your information for advertising, and we do not sell, rent or trade it.",
      },
      { t: "h2", text: "Who can see it" },
      {
        t: "p",
        text: "Only HOEP board members who need it for their role can see your information, and access is limited by role. Health information is visible only to the President and Vice President. Board members sign in with secure accounts, and access to records is logged.",
      },
      {
        t: "p",
        text: "We use trusted service providers to run the website. They process information only to provide their service to HOEP:",
      },
      {
        t: "table",
        head: ["Provider", "What it does for HOEP"],
        rows: [
          ["Vercel", "Hosts the website; privacy-friendly page-view statistics"],
          ["Neon", "Stores our database"],
          ["Resend", "Sends our emails"],
          ["Cloudflare", "Stores event photos; protects our forms from spam bots"],
          ["Auth0", "Board member sign-in"],
          ["Sanity", "Manages public website content (no family information)"],
          ["Google", "Shows a map on our contact page"],
        ],
      },
      {
        t: "p",
        text: "We may share information if the law requires it, or to protect someone’s safety.",
      },
      { t: "h2", text: "Your consents" },
      {
        t: "p",
        text: "When you register, you agree that HOEP may keep your information and contact you about events and services. Photo and video consent is separate and optional. You can change either at any time by contacting us. Withdrawing consent stops invitations and other non-essential email. If you have an active RSVP, we will still send that event’s confirmation and reminder unless you cancel the RSVP.",
      },
      { t: "p", text: "Every invitation email also has an unsubscribe link." },
      { t: "h2", text: "Children" },
      {
        t: "p",
        text: "Only adults (18 or older) can register. A parent or legal guardian may include their minor children and their information. Read our [Children and Age Policy](/children) for details.",
      },
      { t: "h2", text: "How long we keep it" },
      {
        t: "table",
        head: ["Information", "How long"],
        rows: [
          [
            "Your household record",
            "While you’re involved with HOEP. If there’s no RSVP or contact from you for 3 years, we’ll reach out, and delete it if we don’t hear back",
          ],
          ["An unconfirmed adult’s details", "30 days, then deleted"],
          ["Event links and QR codes", "Until 30 days after the event"],
          ["Email delivery records", "1 year"],
          ["Access logs", "3 years"],
          ["Contact-form messages", "In HOEP’s inbox until the matter is resolved"],
          ["Published photos", "Until we remove them, including on request"],
        ],
      },
      {
        t: "p",
        text: "Deleted information may remain in secure backups for a limited period ({BACKUP}) before it is permanently erased.",
      },
      { t: "h2", text: "Your choices and rights" },
      { t: "p", text: "You can ask us to:" },
      {
        t: "ul",
        items: [
          "Tell you what information we have about you and your household.",
          "Correct it.",
          "Delete it, completely.",
          "Remove a photo of you or your child from our website or social media.",
          "Stop contacting you.",
        ],
      },
      {
        t: "p",
        text: "Contact us at {EMAIL} or {PHONE}. We may ask a question to confirm it’s really you, and we will respond within 30 days.",
      },
      { t: "h2", text: "Security" },
      {
        t: "p",
        text: "We protect your information with encrypted connections, restricted access for board members, private links that can’t be guessed, and by never putting health information in emails, links or QR codes. No system is perfectly secure; if a breach affected your information, we would notify you as the law requires.",
      },
      { t: "h2", text: "Changes to this policy" },
      {
        t: "p",
        text: "If we change this policy, we’ll post the new version here with a new effective date. If a change affects how we use information you already gave us, we’ll ask for your consent again.",
      },
      { t: "h2", text: "Contact" },
      {
        t: "p",
        text: "Hemophilia Outreach of El Paso · El Paso, Texas · {EMAIL} · {PHONE}",
      },
    ],
  },
  es: {
    title: "Política de Privacidad",
    blocks: [
      {
        t: "p",
        text: "Hemophilia Outreach of El Paso (HOEP) es una organización sin fines de lucro que apoya a las familias afectadas por trastornos hemorrágicos en el área de El Paso. Esta política explica qué información recopilamos a través de nuestro sitio web y de nuestros eventos, para qué la usamos, quién puede verla, cuánto tiempo la conservamos y qué opciones tiene usted. Nunca vendemos su información.",
      },
      { t: "h2", text: "Información que recopilamos" },
      { t: "p", text: "**Cuando registra a su hogar:**" },
      {
        t: "ul",
        items: [
          "Su nombre, su correo electrónico y/o su número de teléfono, y su idioma preferido (inglés o español).",
          "Su dirección postal, si decide darla.",
          "Las personas de su hogar: nombre (el apellido es opcional), parentesco con usted y grupo de edad. No pedimos fechas de nacimiento.",
          "Si usted decide decírnoslo, si usted o un menor de su hogar tiene un trastorno hemorrágico y cuál (por ejemplo, hemofilia A, hemofilia B o enfermedad de von Willebrand). Esta es información de salud y la tratamos con especial cuidado.",
          "Sus consentimientos y la fecha en que los dio (vea “Sus consentimientos” más abajo).",
        ],
      },
      {
        t: "p",
        text: "**A los adultos de su hogar** les pedimos que confirmen su propia información. Si usted incluye a alguien de 18 años o más, le enviamos un solo correo con un enlace privado, o lo llamamos si no tiene correo. Cada persona decide por sí misma si comparte información de salud y si da su consentimiento. Si no confirma en 30 días, borramos lo que usted escribió sobre esa persona, salvo una nota de que su hogar incluye un adulto más.",
      },
      {
        t: "p",
        text: "**Cuando confirma su asistencia o asiste a un evento:** quién de su hogar va a asistir, el número de invitados y quién se registró a la entrada.",
      },
      {
        t: "p",
        text: "**Cuando se comunica con nosotros:** su nombre, correo electrónico, teléfono (opcional) y su mensaje. Los mensajes del formulario de contacto se envían al correo de HOEP y no se guardan en nuestra base de datos. Por favor, no incluya detalles médicos en un mensaje de contacto; le responderemos de forma privada.",
      },
      {
        t: "p",
        text: "**Cuando visita el sitio web:** usamos estadísticas de visitas que respetan la privacidad, no usan cookies y no lo identifican. Guardamos una sola cookie para recordar su idioma. Nuestro proveedor de alojamiento web ve información técnica estándar, como su dirección IP, para poder mostrarle el sitio.",
      },
      {
        t: "p",
        text: "**Fotos:** HOEP puede tomar fotos en los eventos. Solo publicamos fotos de las personas que dieron su consentimiento para el uso de fotos (vea más abajo).",
      },
      { t: "h2", text: "Cómo la usamos" },
      {
        t: "ul",
        items: [
          "Para invitarle a eventos. Algunos eventos son para grupos específicos, como familias afectadas por una condición en particular o niños de cierta edad, por lo que podemos usar la información de su hogar para decidir qué invitaciones enviarle. Las invitaciones nunca dicen por qué se le invitó ni mencionan el diagnóstico de nadie.",
          "Para administrar las confirmaciones de asistencia, enviar confirmaciones y recordatorios, y registrar la entrada de las personas a los eventos.",
          "Para responder a sus mensajes.",
          "Para mejorar nuestros programas, usando cifras generales (por ejemplo, cuántas familias asistieron).",
        ],
      },
      {
        t: "p",
        text: "No usamos su información para publicidad, y no la vendemos, alquilamos ni intercambiamos.",
      },
      { t: "h2", text: "Quién puede verla" },
      {
        t: "p",
        text: "Solo los miembros de la junta directiva de HOEP que la necesitan para su cargo pueden ver su información, y el acceso está limitado según el cargo. La información de salud solo la ven la presidencia y la vicepresidencia. Los miembros de la junta inician sesión con cuentas seguras, y el acceso a los registros queda anotado.",
      },
      {
        t: "p",
        text: "Usamos proveedores de servicios de confianza para operar el sitio web. Ellos procesan la información únicamente para prestar su servicio a HOEP:",
      },
      {
        t: "table",
        head: ["Proveedor", "Qué hace para HOEP"],
        rows: [
          ["Vercel", "Aloja el sitio web; estadísticas de visitas que respetan la privacidad"],
          ["Neon", "Guarda nuestra base de datos"],
          ["Resend", "Envía nuestros correos electrónicos"],
          ["Cloudflare", "Guarda las fotos de los eventos; protege nuestros formularios contra robots de spam"],
          ["Auth0", "Inicio de sesión de los miembros de la junta"],
          ["Sanity", "Administra el contenido público del sitio web (sin información de las familias)"],
          ["Google", "Muestra un mapa en nuestra página de contacto"],
        ],
      },
      {
        t: "p",
        text: "Podemos compartir información si la ley lo exige o para proteger la seguridad de alguien.",
      },
      { t: "h2", text: "Sus consentimientos" },
      {
        t: "p",
        text: "Al registrarse, usted acepta que HOEP guarde su información y se comunique con usted sobre eventos y servicios. El consentimiento para fotos y videos es aparte y es opcional. Puede cambiar cualquiera de los dos en cualquier momento comunicándose con nosotros. Al retirar su consentimiento, dejamos de enviarle invitaciones y otros correos que no sean esenciales. Si tiene una confirmación de asistencia activa, seguiremos enviándole la confirmación y el recordatorio de ese evento, a menos que cancele su asistencia.",
      },
      {
        t: "p",
        text: "Cada correo de invitación también incluye un enlace para cancelar la suscripción.",
      },
      { t: "h2", text: "Menores de edad" },
      {
        t: "p",
        text: "Solo los adultos (de 18 años o más) pueden registrarse. Un padre, madre o tutor legal puede incluir a sus hijos menores de edad y su información. Lea nuestra [Política para Menores y Edad](/children) para más detalles.",
      },
      { t: "h2", text: "Cuánto tiempo la conservamos" },
      {
        t: "table",
        head: ["Información", "Cuánto tiempo"],
        rows: [
          [
            "El registro de su hogar",
            "Mientras usted participe con HOEP. Si pasan 3 años sin confirmación de asistencia ni contacto de su parte, nos comunicaremos con usted y lo borraremos si no recibimos respuesta",
          ],
          ["Datos de un adulto sin confirmar", "30 días; después se borran"],
          ["Enlaces y códigos QR de eventos", "Hasta 30 días después del evento"],
          ["Registros de entrega de correos", "1 año"],
          ["Registros de acceso", "3 años"],
          ["Mensajes del formulario de contacto", "En el correo de HOEP hasta que el asunto se resuelva"],
          ["Fotos publicadas", "Hasta que las retiremos, incluso si usted lo solicita"],
        ],
      },
      {
        t: "p",
        text: "La información borrada puede permanecer en copias de seguridad protegidas durante un tiempo limitado ({BACKUP}) antes de eliminarse por completo.",
      },
      { t: "h2", text: "Sus opciones y derechos" },
      { t: "p", text: "Usted puede pedirnos que:" },
      {
        t: "ul",
        items: [
          "Le digamos qué información tenemos sobre usted y su hogar.",
          "La corrijamos.",
          "La borremos por completo.",
          "Retiremos de nuestro sitio web o redes sociales una foto suya o de su hijo o hija.",
          "Dejemos de comunicarnos con usted.",
        ],
      },
      {
        t: "p",
        text: "Escríbanos a {EMAIL} o llámenos al {PHONE}. Es posible que le hagamos una pregunta para confirmar que realmente es usted, y le responderemos en un plazo de 30 días.",
      },
      { t: "h2", text: "Seguridad" },
      {
        t: "p",
        text: "Protegemos su información con conexiones cifradas, acceso restringido para los miembros de la junta, enlaces privados imposibles de adivinar, y nunca incluimos información de salud en correos, enlaces ni códigos QR. Ningún sistema es perfectamente seguro; si una violación de seguridad afectara su información, se lo notificaríamos como lo exige la ley.",
      },
      { t: "h2", text: "Cambios a esta política" },
      {
        t: "p",
        text: "Si cambiamos esta política, publicaremos aquí la nueva versión con una nueva fecha de vigencia. Si un cambio afecta la manera en que usamos información que usted ya nos dio, le pediremos su consentimiento de nuevo.",
      },
      { t: "h2", text: "Contacto" },
      {
        t: "p",
        text: "Hemophilia Outreach of El Paso · El Paso, Texas · {EMAIL} · {PHONE}",
      },
      {
        t: "p",
        text: "Esta es una traducción para su comodidad. Si hay alguna diferencia entre la versión en español y la versión en inglés, prevalece la versión en inglés.",
      },
    ],
  },
};
