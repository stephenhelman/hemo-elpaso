import { LEGAL_EFFECTIVE_DATE } from "./meta";
import type { LegalDoc } from "./types";

/**
 * Privacy Policy v2 (board-approved master policy, docs/legal/POLICY_V2_DRAFT.md). English controls. Spanish is a
 * working translation awaiting native-speaker review (docs/overhaul/ES_REVIEW.md, "Legal v2").
 * Version 1 stays in git history (tag full-app-2026-11 and earlier commits). Never edit a published version in place:
 * add privacy v3.
 *
 * Sections marked {STATUS:key} follow the feature toggle of that key (Admin > Settings > Feature toggles): they read
 * "Not yet available" until the toggle is on, then "Available since <date>". See types.ts and analyze.ts.
 */
export const privacy: LegalDoc = {
  version: "2",
  effectiveDate: LEGAL_EFFECTIVE_DATE,
  en: {
    title: "Privacy Policy",
    blocks: [
      {
        t: "p",
        text: "Hemophilia Outreach of El Paso (HOEP) is a nonprofit that supports families affected by bleeding disorders in the El Paso area. This policy explains what information we collect, why, who can see it, how long we keep it, and your choices. Some features below are marked “Not yet available”: we describe them now so you know exactly how they will work before they start. We never sell your information.",
      },
      { t: "h2", text: "Information we collect" },
      {
        t: "p",
        text: "**When you register your household:** your name, email and/or phone number, preferred language, and mailing address if you give it. The people in your household: first name (last name optional), relationship to you, and age group, never a date of birth. If you choose to tell us, whether you or a child in your household has a bleeding disorder, and which one. This is health information, and we treat it with extra care. We also record your consents and when you gave them.",
      },
      {
        t: "p",
        text: "**Adults in your household** confirm their own information. If you list someone 18 or older, we email or call them once. They decide for themselves whether to share health information and whether to consent. If they don’t confirm within 30 days, we delete what you entered about them.",
      },
      { t: "p", text: "**When you RSVP or attend an event:** who in your household is coming, the number of guests, and who checked in." },
      {
        t: "p",
        text: "**When you contact us:** your name, email, phone (optional) and message. Messages go to HOEP’s email and are not stored in our database. Please don’t include medical details; we will follow up privately.",
      },
      {
        t: "p",
        text: "**When you visit the website:** privacy-friendly page-view statistics that use no cookies and don’t identify you, and one cookie that remembers your language. Our hosting provider sees standard technical information, such as your IP address, to deliver the site.",
      },
      { t: "p", text: "**Photos at events:** we publish photos only of people who consented to photo use." },
      {
        t: "p",
        text: "**Event recordings and live streams.** {STATUS:recordings} Some events may be streamed live and recorded so families who can’t attend can watch. We announce this on the invitation, at the door and at the start. We point cameras at presenters, not the audience. When someone asks a question, the presenter repeats it rather than showing the person. Families who declined photo use are kept off camera. Recordings are posted as unlisted videos or on the family page, not publicly searchable.",
      },
      {
        t: "p",
        text: "**Live captions and translation (Puente Live).** {STATUS:live_captions} At some events and meetings, HOEP’s own app, Puente Live, shows live English and Spanish captions of what is said. Speech is sent to a speech-to-text service and the text to a translation service; neither keeps it beyond processing, except as described under “How long we keep it”. HOEP doesn’t save the audio. Captions are machine-made and can be wrong; they are not a replacement for a qualified interpreter. A board member can pause captions at any time, for example when someone shares something personal. Board members may download a transcript after an event to help write newsletters or blog posts. We never publish a whole transcript.",
      },
      {
        t: "p",
        text: "**When you sign in to your family page.** {STATUS:family_portal} You sign in with Google, Apple or Facebook. The service shares your name and email with us, and we use the email to find your household. We keep a record of which sign-in is linked to your household. If we can’t find your household, we keep that sign-in record for up to 30 days so the board can help you. We never receive your password for those services. A cookie keeps you signed in.",
      },
      {
        t: "p",
        text: "**When you verify a diagnosis (optional).** {STATUS:verification} You can upload a letter from a health care provider confirming a bleeding disorder for you or a child in your household. Only the President and Vice President can open it. We delete the file as soon as it’s reviewed and keep only the result: which diagnosis was confirmed, the date, and who reviewed it.",
      },
      {
        t: "p",
        text: "**Text messages.** {STATUS:sms} If you opt in, your mobile number and whether you agreed to texts. Texts include event reminders, announcements and sign-in codes. Reply STOP at any time.",
      },
      { t: "p", text: "**Newsletter.** {STATUS:newsletter} If you subscribe, your email and language. You can unsubscribe in any newsletter." },
      {
        t: "p",
        text: "**Patient stories and blog.** {STATUS:stories} If you share your story, what you choose to tell us and any photos you provide, only with your signed permission (a parent or guardian signs for a child). Quotes from events are used without names unless the person gives permission.",
      },
      {
        t: "p",
        text: "**Financial assistance and scholarships.** {STATUS:assistance} If you apply, what the application asks for, such as the reason, the amount and supporting documents, plus a record of any payment. These programs require a verified diagnosis.",
      },
      {
        t: "p",
        text: "**Polls and questions at events.** {STATUS:live_interaction} Your answers to live polls are anonymous. Questions you submit may be shown on screen without your name.",
      },
      {
        t: "p",
        text: "**Community Q&A.** {STATUS:community} Questions and answers you post, which a board member reviews before they appear. Please don’t post health details you wouldn’t want others to see.",
      },
      {
        t: "p",
        text: "**Online donations.** {STATUS:donations} A payment company processes donations. HOEP receives your name, email, the amount and the date for receipts. We never see or store your full card number.",
      },
      { t: "p", text: "**Volunteer sign-up.** {STATUS:volunteers} Your name, contact information, availability and the events you volunteer for." },
      { t: "h2", text: "How we use it" },
      {
        t: "ul",
        items: [
          "To invite you to events. Some events are for specific groups, such as families affected by a particular condition or children of a certain age. Invitations never say why you were invited or mention anyone’s diagnosis.",
          "To manage RSVPs, send confirmations and reminders, and check people in.",
          "To answer your messages.",
          "To let you see your household’s information and manage your photo, text and newsletter choices on your family page. {STATUS:family_portal}",
          "To confirm a diagnosis, if you choose to verify it. {STATUS:verification}",
          "To send the texts you opted into. {STATUS:sms}",
          "To send the newsletter you opted into. {STATUS:newsletter}",
          "To review assistance applications. {STATUS:assistance}",
          "To improve our programs using overall counts, never individual records.",
        ],
      },
      {
        t: "p",
        text: "We do not use your information for advertising. We do not sell, rent or trade it. **Sponsors never receive names or contact details.** They see totals only, such as how many families attended.",
      },
      { t: "h2", text: "Verifying a diagnosis" },
      { t: "p", text: "{STATUS:verification} Verification is optional. You can register, RSVP and use your family page without it." },
      {
        t: "p",
        text: "If you don’t verify: 60 days after your household is asked to, we stop including you in invitations to events meant for a specific diagnosis. You still get general invitations, and you can still RSVP to any event you have a link for. You can verify any time and be included again. Financial assistance and scholarships require verification.",
      },
      {
        t: "p",
        text: "How it works: you upload a letter, the President or Vice President reviews it, and we delete the file once they decide, whether or not they approve it. If they can’t approve it, we tell you a general reason and you can try again. We never ask for medical records beyond the letter, and we never share the letter or the result with other organizations.",
      },
      { t: "h2", text: "Who can see it" },
      {
        t: "p",
        text: "Only HOEP board members who need it for their role, with access limited by role. Health information, including diagnosis letters, is visible only to the President and Vice President. Board members sign in with secure accounts, and every access to family records is logged. The account that manages website settings cannot see family information.",
      },
      { t: "p", text: "We use these service providers. They process information only to provide their service to HOEP:" },
      {
        t: "table",
        head: ["Provider", "What it does for HOEP"],
        rows: [
          ["Vercel", "Hosts the website; privacy-friendly page statistics"],
          ["Neon", "Stores our database"],
          ["Resend", "Sends our emails"],
          ["Cloudflare", "Stores event photos; protects our forms from spam"],
          ["Auth0", "Board sign-in and family sign-in with Google, Apple or Facebook. {STATUS:family_portal}"],
          ["Sanity", "Manages public website content (no family information)"],
          ["Google", "HOEP email; the map on our contact page. Google Meet for virtual events and YouTube for recordings. {STATUS:recordings}"],
          ["Railway", "Hosts Puente Live. {STATUS:live_captions}"],
          ["Deepgram", "Turns speech into text for live captions; audio is kept only while it’s processed. {STATUS:live_captions}"],
          ["Anthropic", "Translates caption text; deleted within 30 days and never used to train models. {STATUS:live_captions}"],
          ["Twilio", "Sends text messages. {STATUS:sms}"],
          ["Payment processor: {PROCESSOR}", "Processes donations. {STATUS:donations}"],
        ],
      },
      { t: "p", text: "We may share information if the law requires it, or to protect someone’s safety." },
      { t: "h2", text: "Your consents" },
      {
        t: "p",
        text: "When you register, you agree that HOEP may keep your information and contact you about events and services. Photo and video use is separate and optional, and so are texts and the newsletter. Some actions, like uploading a letter or applying for assistance, ask for a short consent at that moment. You can change any consent by contacting us. Withdrawing consent stops invitations and other non-essential messages; we still send confirmations and reminders for an RSVP you keep.",
      },
      { t: "h2", text: "Children" },
      {
        t: "p",
        text: "Only adults (18 or older) can register or sign in. A parent or legal guardian may include their children. See our [Children and Age Policy](/children).",
      },
      { t: "h2", text: "How long we keep it" },
      {
        t: "table",
        head: ["Information", "How long"],
        rows: [
          ["Your household record", "While you’re involved with HOEP. After 3 years with no RSVP or contact, we reach out, then delete it if we don’t hear back"],
          ["An unconfirmed adult’s details", "30 days, then deleted"],
          ["Event links and QR codes", "Until 30 days after the event"],
          ["Email delivery records", "1 year"],
          ["Access logs", "3 years"],
          ["Contact-form messages", "In HOEP’s inbox until the matter is resolved"],
          ["Published photos", "Until we remove them, including on request"],
          ["Event recordings {STATUS:recordings}", "Until removed, including on request"],
          ["Live caption audio {STATUS:live_captions}", "Not saved by HOEP; held by the speech service only while processing"],
          ["Caption text sent for translation {STATUS:live_captions}", "Deleted by the translation service within 30 days"],
          ["Downloaded event transcripts {STATUS:live_captions}", "{TRANSCRIPT}, then deleted"],
          ["Diagnosis letters {STATUS:verification}", "Until reviewed, no more than 14 days"],
          ["Verification result {STATUS:verification}", "Same as your household record"],
          ["Sign-in sessions {STATUS:family_portal}", "Up to 7 days, and you’re signed out after 24 hours of inactivity"],
          ["Linked sign-ins {STATUS:family_portal}", "Which Google, Apple or Facebook sign-in is linked to your household: while your household record exists"],
          ["Sign-ins we couldn’t match to a household {STATUS:family_portal}", "30 days after last use, then deleted"],
          ["Assistance records {STATUS:assistance}", "{ASSISTANCE_RETENTION}"],
          ["Donation records {STATUS:donations}", "As required for tax receipts"],
        ],
      },
      { t: "p", text: "Deleted information may stay in secure backups for {BACKUP} before it is permanently erased." },
      { t: "h2", text: "Your choices and rights" },
      {
        t: "p",
        text: "You can ask us to tell you what we have about you and your household; correct it; delete it completely, including any verification result; remove a photo, recording or quote of you or your child; or stop contacting you. Contact {EMAIL} or {PHONE}. We may ask a question to confirm it’s you, and we respond within 30 days.",
      },
      { t: "h2", text: "Security" },
      {
        t: "p",
        text: "Encrypted connections, role-limited access for board members, private links that can’t be guessed, and no health information in emails, links or QR codes. {STATUS:family_portal} Diagnosis letters are stored privately and deleted after review. {STATUS:verification} No system is perfectly secure. If a breach affected your information, we would notify you as the law requires.",
      },
      { t: "h2", text: "Changes to this policy" },
      {
        t: "p",
        text: "When a feature marked “Not yet available” starts, this page updates to show the date. If we change how we use information you already gave us, we’ll tell you and ask for your consent again.",
      },
      { t: "h2", text: "Contact" },
      { t: "p", text: "Hemophilia Outreach of El Paso · {ADDRESS}{EMAIL} · {PHONE}" },
    ],
  },
  es: {
    title: "Política de Privacidad",
    blocks: [
      {
        t: "p",
        text: "Hemophilia Outreach of El Paso (HOEP) es una organización sin fines de lucro que apoya a las familias afectadas por trastornos hemorrágicos en el área de El Paso. Esta política explica qué información recopilamos, para qué, quién puede verla, cuánto tiempo la conservamos y qué opciones tiene usted. Algunas funciones de abajo están marcadas como “Aún no disponible”: las describimos desde ahora para que sepa exactamente cómo funcionarán antes de que empiecen. Nunca vendemos su información.",
      },
      { t: "h2", text: "Información que recopilamos" },
      {
        t: "p",
        text: "**Cuando registra a su hogar:** su nombre, su correo electrónico y/o su número de teléfono, su idioma preferido y su dirección postal, si decide darla. Las personas de su hogar: nombre (el apellido es opcional), parentesco con usted y grupo de edad, nunca la fecha de nacimiento. Si usted decide decírnoslo, si usted o un menor de su hogar tiene un trastorno hemorrágico y cuál. Esta es información de salud y la tratamos con especial cuidado. También anotamos sus consentimientos y la fecha en que los dio.",
      },
      {
        t: "p",
        text: "**Los adultos de su hogar** confirman su propia información. Si usted incluye a alguien de 18 años o más, le enviamos un correo o lo llamamos una sola vez. Cada persona decide por sí misma si comparte información de salud y si da su consentimiento. Si no confirma en 30 días, borramos lo que usted escribió sobre esa persona.",
      },
      { t: "p", text: "**Cuando confirma su asistencia o asiste a un evento:** quién de su hogar va a asistir, el número de invitados y quién se registró a la entrada." },
      {
        t: "p",
        text: "**Cuando se comunica con nosotros:** su nombre, correo electrónico, teléfono (opcional) y su mensaje. Los mensajes llegan al correo de HOEP y no se guardan en nuestra base de datos. Por favor, no incluya detalles médicos; le responderemos de forma privada.",
      },
      {
        t: "p",
        text: "**Cuando visita el sitio web:** estadísticas de visitas que respetan la privacidad, no usan cookies y no lo identifican, y una sola cookie que recuerda su idioma. Nuestro proveedor de alojamiento web ve información técnica estándar, como su dirección IP, para poder mostrarle el sitio.",
      },
      { t: "p", text: "**Fotos en los eventos:** solo publicamos fotos de las personas que dieron su consentimiento para el uso de fotos." },
      {
        t: "p",
        text: "**Grabaciones y transmisiones en vivo de eventos.** {STATUS:recordings} Algunos eventos podrían transmitirse en vivo y grabarse para que las familias que no pueden asistir los vean. Lo anunciaremos en la invitación, en la puerta y al comenzar. Las cámaras apuntan a quienes presentan, no al público. Cuando alguien hace una pregunta, quien presenta la repite en lugar de mostrar a la persona. Las familias que no aceptaron el uso de fotos quedan fuera de cámara. Las grabaciones se publican como videos no listados o en la página familiar, y no aparecen en las búsquedas públicas.",
      },
      {
        t: "p",
        text: "**Subtítulos y traducción en vivo (Puente Live).** {STATUS:live_captions} En algunos eventos y reuniones, la aplicación propia de HOEP, Puente Live, muestra subtítulos en vivo en inglés y español de lo que se dice. La voz se envía a un servicio que la convierte en texto, y el texto a un servicio de traducción; ninguno la conserva más allá del procesamiento, salvo lo que se indica en “Cuánto tiempo la conservamos”. HOEP no guarda el audio. Los subtítulos los genera una máquina y pueden tener errores; no sustituyen a un intérprete calificado. Un miembro de la junta puede pausar los subtítulos en cualquier momento, por ejemplo cuando alguien comparte algo personal. Los miembros de la junta pueden descargar una transcripción después del evento para ayudar a escribir boletines o artículos del blog. Nunca publicamos una transcripción completa.",
      },
      {
        t: "p",
        text: "**Cuando inicia sesión en su página familiar.** {STATUS:family_portal} Usted inicia sesión con Google, Apple o Facebook. El servicio comparte con nosotros su nombre y correo, y usamos el correo para encontrar su hogar. Guardamos un registro de qué inicio de sesión está vinculado a su hogar. Si no encontramos su hogar, conservamos ese registro hasta 30 días para que la junta pueda ayudarle. Nunca recibimos su contraseña de esos servicios. Una cookie mantiene su sesión abierta.",
      },
      {
        t: "p",
        text: "**Cuando verifica un diagnóstico (opcional).** {STATUS:verification} Puede subir una carta de un profesional de la salud que confirme un trastorno hemorrágico suyo o de un menor de su hogar. Solo la presidencia y la vicepresidencia pueden abrirla. Borramos el archivo en cuanto se revisa y conservamos solo el resultado: qué diagnóstico se confirmó, la fecha y quién lo revisó.",
      },
      {
        t: "p",
        text: "**Mensajes de texto.** {STATUS:sms} Si usted acepta, su número de celular y si aceptó recibir mensajes. Los mensajes incluyen recordatorios de eventos, avisos y códigos para iniciar sesión. Responda STOP en cualquier momento para dejar de recibirlos.",
      },
      { t: "p", text: "**Boletín.** {STATUS:newsletter} Si se suscribe, su correo electrónico y su idioma. Puede cancelar la suscripción en cualquier boletín." },
      {
        t: "p",
        text: "**Historias de pacientes y blog.** {STATUS:stories} Si comparte su historia, lo que usted decida contarnos y las fotos que nos dé, solo con su permiso firmado (un padre, madre o tutor firma por un menor). Las frases dichas en los eventos se usan sin nombre, salvo que la persona dé su permiso.",
      },
      {
        t: "p",
        text: "**Ayuda financiera y becas.** {STATUS:assistance} Si presenta una solicitud, lo que ella pide, como el motivo, el monto y los documentos de apoyo, y un registro de cualquier pago. Estos programas requieren un diagnóstico verificado.",
      },
      {
        t: "p",
        text: "**Encuestas y preguntas en eventos.** {STATUS:live_interaction} Sus respuestas a las encuestas en vivo son anónimas. Las preguntas que envíe pueden mostrarse en pantalla sin su nombre.",
      },
      {
        t: "p",
        text: "**Preguntas y respuestas de la comunidad.** {STATUS:community} Las preguntas y respuestas que publique, que un miembro de la junta revisa antes de que aparezcan. Por favor, no publique datos de salud que no quisiera que otras personas vean.",
      },
      {
        t: "p",
        text: "**Donaciones en línea.** {STATUS:donations} Una empresa de pagos procesa las donaciones. HOEP recibe su nombre, su correo, el monto y la fecha para los recibos. Nunca vemos ni guardamos el número completo de su tarjeta.",
      },
      { t: "p", text: "**Registro de voluntarios.** {STATUS:volunteers} Su nombre, datos de contacto, disponibilidad y los eventos en los que se ofrece como voluntario." },
      { t: "h2", text: "Cómo la usamos" },
      {
        t: "ul",
        items: [
          "Para invitarle a eventos. Algunos eventos son para grupos específicos, como familias afectadas por una condición en particular o niños de cierta edad. Las invitaciones nunca dicen por qué se le invitó ni mencionan el diagnóstico de nadie.",
          "Para administrar las confirmaciones de asistencia, enviar confirmaciones y recordatorios, y registrar la entrada de las personas.",
          "Para responder a sus mensajes.",
          "Para que pueda ver la información de su hogar y administrar sus opciones de fotos, mensajes de texto y boletín en su página familiar. {STATUS:family_portal}",
          "Para confirmar un diagnóstico, si usted decide verificarlo. {STATUS:verification}",
          "Para enviarle los mensajes de texto que aceptó recibir. {STATUS:sms}",
          "Para enviarle el boletín que aceptó recibir. {STATUS:newsletter}",
          "Para revisar las solicitudes de ayuda. {STATUS:assistance}",
          "Para mejorar nuestros programas usando cifras generales, nunca registros individuales.",
        ],
      },
      {
        t: "p",
        text: "No usamos su información para publicidad. No la vendemos, alquilamos ni intercambiamos. **Los patrocinadores nunca reciben nombres ni datos de contacto.** Solo ven totales, como cuántas familias asistieron.",
      },
      { t: "h2", text: "Verificación de un diagnóstico" },
      { t: "p", text: "{STATUS:verification} La verificación es opcional. Puede registrarse, confirmar su asistencia y usar su página familiar sin verificar." },
      {
        t: "p",
        text: "Si no verifica: 60 días después de que se le pida a su hogar que lo haga, dejamos de incluirle en las invitaciones a eventos para un diagnóstico específico. Seguirá recibiendo las invitaciones generales y podrá confirmar su asistencia a cualquier evento del que tenga un enlace. Puede verificar en cualquier momento y volver a ser incluido. La ayuda financiera y las becas requieren verificación.",
      },
      {
        t: "p",
        text: "Cómo funciona: usted sube una carta, la presidencia o la vicepresidencia la revisa y borramos el archivo en cuanto decide, la apruebe o no. Si no se puede aprobar, le explicamos el motivo en términos generales y puede intentarlo de nuevo. Nunca pedimos expedientes médicos aparte de la carta, y nunca compartimos la carta ni el resultado con otras organizaciones.",
      },
      { t: "h2", text: "Quién puede verla" },
      {
        t: "p",
        text: "Solo los miembros de la junta de HOEP que la necesitan para su cargo, con acceso limitado según el cargo. La información de salud, incluidas las cartas de diagnóstico, solo la ven la presidencia y la vicepresidencia. Los miembros de la junta inician sesión con cuentas seguras, y cada acceso a los registros de las familias queda anotado. La cuenta que administra la configuración del sitio no puede ver información de las familias.",
      },
      { t: "p", text: "Usamos estos proveedores de servicios. Ellos procesan la información únicamente para prestar su servicio a HOEP:" },
      {
        t: "table",
        head: ["Proveedor", "Qué hace para HOEP"],
        rows: [
          ["Vercel", "Aloja el sitio web; estadísticas de visitas que respetan la privacidad"],
          ["Neon", "Guarda nuestra base de datos"],
          ["Resend", "Envía nuestros correos electrónicos"],
          ["Cloudflare", "Guarda las fotos de los eventos; protege nuestros formularios contra el spam"],
          ["Auth0", "Inicio de sesión de la junta y de las familias con Google, Apple o Facebook. {STATUS:family_portal}"],
          ["Sanity", "Administra el contenido público del sitio web (sin información de las familias)"],
          ["Google", "Correo de HOEP; el mapa de nuestra página de contacto. Google Meet para eventos virtuales y YouTube para las grabaciones. {STATUS:recordings}"],
          ["Railway", "Aloja Puente Live. {STATUS:live_captions}"],
          ["Deepgram", "Convierte la voz en texto para los subtítulos en vivo; el audio se conserva solo mientras se procesa. {STATUS:live_captions}"],
          ["Anthropic", "Traduce el texto de los subtítulos; se borra en un plazo de 30 días y nunca se usa para entrenar modelos. {STATUS:live_captions}"],
          ["Twilio", "Envía los mensajes de texto. {STATUS:sms}"],
          ["Procesador de pagos: {PROCESSOR}", "Procesa las donaciones. {STATUS:donations}"],
        ],
      },
      { t: "p", text: "Podemos compartir información si la ley lo exige o para proteger la seguridad de alguien." },
      { t: "h2", text: "Sus consentimientos" },
      {
        t: "p",
        text: "Al registrarse, usted acepta que HOEP guarde su información y se comunique con usted sobre eventos y servicios. El uso de fotos y videos es aparte y opcional, igual que los mensajes de texto y el boletín. Algunas acciones, como subir una carta o solicitar ayuda, piden un consentimiento breve en ese momento. Puede cambiar cualquier consentimiento comunicándose con nosotros. Al retirar su consentimiento dejamos de enviarle invitaciones y otros mensajes que no sean esenciales; seguimos enviando las confirmaciones y los recordatorios de una asistencia que usted mantenga.",
      },
      { t: "h2", text: "Menores de edad" },
      {
        t: "p",
        text: "Solo los adultos (de 18 años o más) pueden registrarse o iniciar sesión. Un padre, madre o tutor legal puede incluir a sus hijos. Lea nuestra [Política para Menores y Edad](/children).",
      },
      { t: "h2", text: "Cuánto tiempo la conservamos" },
      {
        t: "table",
        head: ["Información", "Cuánto tiempo"],
        rows: [
          ["El registro de su hogar", "Mientras usted participe con HOEP. Después de 3 años sin confirmación de asistencia ni contacto, nos comunicamos con usted y lo borramos si no recibimos respuesta"],
          ["Datos de un adulto sin confirmar", "30 días; después se borran"],
          ["Enlaces y códigos QR de eventos", "Hasta 30 días después del evento"],
          ["Registros de entrega de correos", "1 año"],
          ["Registros de acceso", "3 años"],
          ["Mensajes del formulario de contacto", "En el correo de HOEP hasta que el asunto se resuelva"],
          ["Fotos publicadas", "Hasta que las retiremos, incluso si usted lo solicita"],
          ["Grabaciones de eventos {STATUS:recordings}", "Hasta que se retiren, incluso si usted lo solicita"],
          ["Audio de los subtítulos en vivo {STATUS:live_captions}", "HOEP no lo guarda; el servicio de voz lo conserva solo mientras lo procesa"],
          ["Texto de subtítulos enviado a traducción {STATUS:live_captions}", "El servicio de traducción lo borra en un plazo de 30 días"],
          ["Transcripciones de eventos descargadas {STATUS:live_captions}", "{TRANSCRIPT}; después se borran"],
          ["Cartas de diagnóstico {STATUS:verification}", "Hasta que se revisan, máximo 14 días"],
          ["Resultado de la verificación {STATUS:verification}", "Igual que el registro de su hogar"],
          ["Sesiones de inicio de sesión {STATUS:family_portal}", "Hasta 7 días, y se cierra su sesión tras 24 horas de inactividad"],
          ["Inicios de sesión vinculados {STATUS:family_portal}", "Qué inicio de sesión de Google, Apple o Facebook está vinculado a su hogar: mientras exista el registro de su hogar"],
          ["Inicios de sesión que no pudimos asociar a un hogar {STATUS:family_portal}", "30 días después del último uso, y luego se borran"],
          ["Registros de ayuda financiera {STATUS:assistance}", "{ASSISTANCE_RETENTION}"],
          ["Registros de donaciones {STATUS:donations}", "Lo que exijan los recibos para impuestos"],
        ],
      },
      { t: "p", text: "La información borrada puede permanecer en copias de seguridad protegidas durante {BACKUP} antes de eliminarse por completo." },
      { t: "h2", text: "Sus opciones y derechos" },
      {
        t: "p",
        text: "Puede pedirnos que le digamos qué información tenemos sobre usted y su hogar; que la corrijamos; que la borremos por completo, incluido cualquier resultado de verificación; que retiremos una foto, una grabación o una cita suya o de su hijo o hija; o que dejemos de comunicarnos con usted. Escriba a {EMAIL} o llame al {PHONE}. Es posible que le hagamos una pregunta para confirmar que es usted, y respondemos en un plazo de 30 días.",
      },
      { t: "h2", text: "Seguridad" },
      {
        t: "p",
        text: "Conexiones cifradas, acceso de la junta limitado por cargo, enlaces privados imposibles de adivinar, y nunca incluimos información de salud en correos, enlaces ni códigos QR. {STATUS:family_portal} Las cartas de diagnóstico se guardan en privado y se borran después de revisarse. {STATUS:verification} Ningún sistema es perfectamente seguro. Si una violación de seguridad afectara su información, se lo notificaríamos como lo exige la ley.",
      },
      { t: "h2", text: "Cambios a esta política" },
      {
        t: "p",
        text: "Cuando empiece una función marcada como “Aún no disponible”, esta página se actualizará para mostrar la fecha. Si cambiamos la manera en que usamos información que usted ya nos dio, se lo diremos y le pediremos su consentimiento de nuevo.",
      },
      { t: "h2", text: "Contacto" },
      { t: "p", text: "Hemophilia Outreach of El Paso · {ADDRESS}{EMAIL} · {PHONE}" },
    ],
  },
};
