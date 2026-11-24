/**
 * Consent wording shown on the "Register for Information" form and the adult
 * confirmation page (recorded, with its version, in ConsentRecord.textVersion
 * every time someone consents).
 *
 * When the text changes, add the next version and bump CONSENT_TEXT_VERSION so
 * each ConsentRecord points at exactly the text the person saw. Never edit a
 * published version in place.
 *
 * draft-1: single-person registration (kept so old records stay traceable).
 * draft-2: household wording as first proposed (dev records only; kept for traceability).
 * v1: BOARD-APPROVED household wording (draft-2 text without the draft markers):
 *   - data_and_contact / media speak for the household (primary + minors)
 *   - age_guardian_attestation (primary: 18+, guardian of listed minors)
 *   - member_* texts for adults confirming for themselves at /confirm/[token]
 * v2: v1 plus: the data-and-contact consent covers health information (if the person chooses to share it), names
 *   the Privacy Policy (link), and says consent can be withdrawn at any time; the 18+ attestation links the Children
 *   and Age Policy. media and the 18+ wording are unchanged in meaning. DRAFT pending Stephen's/the board's approval.
 *   Only a test household exists under v1, so there is no re-confirmation flow.
 * v3: (docs/legal/POLICY_V2_DRAFT.md, "Consent v3 text"). media is REPLACED by the photos, video and recordings text
 *   (member_media gets the matching adult wording); new optional sms and newsletter consents (collected at
 *   registration now, only USED while their feature toggles are on); the verification consent text is added for later
 *   (shown at upload; nothing uses it before the verification feature). data_and_contact and the 18+ attestation carry
 *   over from v2 unchanged. v1 and v2 stay in this file, unchanged, for older records.
 * Display order on every form: 1) 18+ attestation, 2) data_and_contact, 3) media, 4) sms, 5) newsletter.
 *
 * Strings may carry the inline markup of components/legal/RichText.tsx ([label](/path)); only the VERSION is stored
 * in ConsentRecord, never the markup.
 */
export const CONSENT_TEXT_VERSION = "v3";

const draft1 = {
  data_and_contact: {
    en: "I agree that Hemophilia Outreach of El Paso (HOEP) may store the information I provide, and may contact me by email, phone, or mail about HOEP events and services. I can ask HOEP to delete my information at any time. [DRAFT - pending board approval]",
    es: "Acepto que Hemophilia Outreach of El Paso (HOEP) guarde la información que proporciono y se comunique conmigo por correo electrónico, teléfono o correo postal sobre eventos y servicios de HOEP. Puedo pedir a HOEP que elimine mi información en cualquier momento. [BORRADOR - pendiente de aprobación de la junta]",
  },
  media: {
    en: "I agree that HOEP may use photos or video that include me or my family at HOEP events in its materials and on its website and social media. This is optional. [DRAFT - pending board approval]",
    es: "Acepto que HOEP pueda usar fotos o videos en los que aparezcamos mi familia o yo en eventos de HOEP, en sus materiales, sitio web y redes sociales. Esto es opcional. [BORRADOR - pendiente de aprobación de la junta]",
  },
} as const;

const draft2 = {
  data_and_contact: {
    en: "I agree that Hemophilia Outreach of El Paso (HOEP) may store the information I provide about me and the minors in my household, and may contact me by email, phone, or mail about HOEP events and services. I can ask HOEP to delete this information at any time. [DRAFT 2 - NEW WORDING, pending board approval]",
    es: "Acepto que Hemophilia Outreach of El Paso (HOEP) guarde la información que proporciono sobre mí y sobre los menores de mi hogar, y se comunique conmigo por correo electrónico, teléfono o correo postal sobre eventos y servicios de HOEP. Puedo pedir a HOEP que elimine esta información en cualquier momento. [BORRADOR 2 - TEXTO NUEVO, pendiente de aprobación de la junta]",
  },
  media: {
    en: "I agree that HOEP may use photos or video that include me or the minors in my household at HOEP events in its materials and on its website and social media. This does not cover other adults, who answer for themselves. This is optional. [DRAFT 2 - NEW WORDING, pending board approval]",
    es: "Acepto que HOEP pueda usar fotos o videos en los que aparezcamos yo o los menores de mi hogar en eventos de HOEP, en sus materiales, sitio web y redes sociales. Esto no cubre a otros adultos, que responden por sí mismos. Esto es opcional. [BORRADOR 2 - TEXTO NUEVO, pendiente de aprobación de la junta]",
  },
  age_guardian_attestation: {
    en: "I am 18 or older, and I am the parent or legal guardian of any minors I listed, or have their guardian's permission. [DRAFT 2 - NEW WORDING, pending board approval]",
    es: "Tengo 18 años o más, y soy el padre, la madre o el tutor legal de los menores que incluí, o tengo el permiso de su tutor. [BORRADOR 2 - TEXTO NUEVO, pendiente de aprobación de la junta]",
  },
  // Adults confirming for themselves (/confirm/[token]).
  member_data_and_contact: {
    en: "I agree that Hemophilia Outreach of El Paso (HOEP) may store the information I provide about myself, and may contact me about HOEP events and services. I can ask HOEP to delete my information at any time. [DRAFT 2 - NEW WORDING, pending board approval]",
    es: "Acepto que Hemophilia Outreach of El Paso (HOEP) guarde la información que proporciono sobre mí y se comunique conmigo sobre eventos y servicios de HOEP. Puedo pedir a HOEP que elimine mi información en cualquier momento. [BORRADOR 2 - TEXTO NUEVO, pendiente de aprobación de la junta]",
  },
  member_media: {
    en: "I agree that HOEP may use photos or video that include me at HOEP events in its materials and on its website and social media. This is optional. [DRAFT 2 - NEW WORDING, pending board approval]",
    es: "Acepto que HOEP pueda usar fotos o videos en los que aparezca yo en eventos de HOEP, en sus materiales, sitio web y redes sociales. Esto es opcional. [BORRADOR 2 - TEXTO NUEVO, pendiente de aprobación de la junta]",
  },
  member_adult_attestation: {
    en: "I am 18 or older. [DRAFT 2 - NEW WORDING, pending board approval]",
    es: "Tengo 18 años o más. [BORRADOR 2 - TEXTO NUEVO, pendiente de aprobación de la junta]",
  },
} as const;

const v1 = {
  data_and_contact: {
    en: "I agree that Hemophilia Outreach of El Paso (HOEP) may store the information I provide about me and the minors in my household, and may contact me by email, phone, or mail about HOEP events and services. I can ask HOEP to delete this information at any time.",
    es: "Acepto que Hemophilia Outreach of El Paso (HOEP) guarde la información que proporciono sobre mí y sobre los menores de mi hogar, y se comunique conmigo por correo electrónico, teléfono o correo postal sobre eventos y servicios de HOEP. Puedo pedir a HOEP que elimine esta información en cualquier momento.",
  },
  media: {
    en: "I agree that HOEP may use photos or video that include me or the minors in my household at HOEP events in its materials and on its website and social media. This does not cover other adults, who answer for themselves. This is optional.",
    es: "Acepto que HOEP pueda usar fotos o videos en los que aparezcamos yo o los menores de mi hogar en eventos de HOEP, en sus materiales, sitio web y redes sociales. Esto no cubre a otros adultos, que responden por sí mismos. Esto es opcional.",
  },
  age_guardian_attestation: {
    en: "I am 18 or older, and I am the parent or legal guardian of any minors I listed, or have their guardian's permission.",
    es: "Tengo 18 años o más, y soy el padre, la madre o el tutor legal de los menores que incluí, o tengo el permiso de su tutor.",
  },
  // Adults confirming for themselves (/confirm/[token]).
  member_data_and_contact: {
    en: "I agree that Hemophilia Outreach of El Paso (HOEP) may store the information I provide about myself, and may contact me about HOEP events and services. I can ask HOEP to delete my information at any time.",
    es: "Acepto que Hemophilia Outreach of El Paso (HOEP) guarde la información que proporciono sobre mí y se comunique conmigo sobre eventos y servicios de HOEP. Puedo pedir a HOEP que elimine mi información en cualquier momento.",
  },
  member_media: {
    en: "I agree that HOEP may use photos or video that include me at HOEP events in its materials and on its website and social media. This is optional.",
    es: "Acepto que HOEP pueda usar fotos o videos en los que aparezca yo en eventos de HOEP, en sus materiales, sitio web y redes sociales. Esto es opcional.",
  },
  member_adult_attestation: {
    en: "I am 18 or older.",
    es: "Tengo 18 años o más.",
  },
} as const;

const v2 = {
  data_and_contact: {
    en: "I agree that Hemophilia Outreach of El Paso (HOEP) may store the information I provide about me and the minors in my household, including health information if I choose to share it, and may contact me by email, phone, or mail about HOEP events and services, as described in the [Privacy Policy](/privacy). I can withdraw this consent, or ask HOEP to delete this information, at any time.",
    es: "Acepto que Hemophilia Outreach of El Paso (HOEP) guarde la información que proporciono sobre mí y sobre los menores de mi hogar, incluida la información de salud si decido compartirla, y se comunique conmigo por correo electrónico, teléfono o correo postal sobre eventos y servicios de HOEP, como se describe en la [Política de Privacidad](/privacy). Puedo retirar este consentimiento, o pedir a HOEP que elimine esta información, en cualquier momento.",
  },
  media: v1.media,
  age_guardian_attestation: {
    en: "I am 18 or older, and I am the parent or legal guardian of any minors I listed, or have their guardian's permission. ([Children and Age Policy](/children))",
    es: "Tengo 18 años o más, y soy el padre, la madre o el tutor legal de los menores que incluí, o tengo el permiso de su tutor. ([Política para Menores y Edad](/children))",
  },
  // Adults confirming for themselves (/confirm/[token]).
  member_data_and_contact: {
    en: "I agree that Hemophilia Outreach of El Paso (HOEP) may store the information I provide about myself, including health information if I choose to share it, and may contact me about HOEP events and services, as described in the [Privacy Policy](/privacy). I can withdraw this consent, or ask HOEP to delete my information, at any time.",
    es: "Acepto que Hemophilia Outreach of El Paso (HOEP) guarde la información que proporciono sobre mí, incluida la información de salud si decido compartirla, y se comunique conmigo sobre eventos y servicios de HOEP, como se describe en la [Política de Privacidad](/privacy). Puedo retirar este consentimiento, o pedir a HOEP que elimine mi información, en cualquier momento.",
  },
  member_media: v1.member_media,
  member_adult_attestation: v1.member_adult_attestation,
} as const;

const v3 = {
  ...v2,
  // Replaces the media consent (optional, at registration).
  media: {
    en: "I agree that HOEP may take and publish photos and video of me and the minors in my household at HOEP events, including event recordings and live streams. HOEP will not name us without asking. I can withdraw this at any time and ask HOEP to remove a photo or recording.",
    es: "Acepto que HOEP pueda tomar y publicar fotos y videos de mí y de los menores de mi hogar en los eventos de HOEP, incluidas las grabaciones y transmisiones en vivo de los eventos. HOEP no nos identificará por nombre sin preguntarnos antes. Puedo retirar este consentimiento en cualquier momento y pedir a HOEP que retire una foto o una grabación.",
  },
  // Adults confirming for themselves (/confirm/[token]): the same wording, for themselves only.
  member_media: {
    en: "I agree that HOEP may take and publish photos and video of me at HOEP events, including event recordings and live streams. HOEP will not name me without asking. I can withdraw this at any time and ask HOEP to remove a photo or recording.",
    es: "Acepto que HOEP pueda tomar y publicar fotos y videos de mí en los eventos de HOEP, incluidas las grabaciones y transmisiones en vivo de los eventos. HOEP no me identificará por nombre sin preguntarme antes. Puedo retirar este consentimiento en cualquier momento y pedir a HOEP que retire una foto o una grabación.",
  },
  // New, optional: at registration (and on the family page once it exists). Used only while the "sms" toggle is on.
  sms: {
    en: "I agree that HOEP may text me at this number about events, reminders, announcements and sign-in codes, once HOEP starts sending texts. Message and data rates may apply. Message frequency varies. Reply STOP to stop, HELP for help. Consent is not required to take part in HOEP.",
    es: "Acepto que HOEP me envíe mensajes de texto a este número sobre eventos, recordatorios, avisos y códigos para iniciar sesión, cuando HOEP empiece a enviar mensajes de texto. Pueden aplicar tarifas de mensajes y datos. La frecuencia de los mensajes varía. Responda STOP para dejar de recibirlos y HELP para obtener ayuda. No es obligatorio dar este consentimiento para participar en HOEP.",
  },
  // New, optional. Used only while the "newsletter" toggle is on.
  newsletter: {
    en: "Send me HOEP's newsletter by email. I can unsubscribe in any newsletter.",
    es: "Quiero recibir el boletín de HOEP por correo electrónico. Puedo cancelar la suscripción en cualquier boletín.",
  },
  // New: shown at upload, required before the upload button works. Nothing uses it until the verification feature.
  verification: {
    en: "I agree that HOEP's President or Vice President may read the letter I am uploading, only to confirm the diagnosis it names. HOEP will delete the letter when they decide and keep only the result (which diagnosis, the date, and who reviewed it). If the letter is about a child in my household, I am that child's parent or legal guardian.",
    es: "Acepto que la presidencia o la vicepresidencia de HOEP pueda leer la carta que estoy subiendo, solo para confirmar el diagnóstico que menciona. HOEP borrará la carta cuando decidan y conservará únicamente el resultado (qué diagnóstico, la fecha y quién lo revisó). Si la carta es sobre un menor de mi hogar, soy el padre, la madre o el tutor legal de ese menor.",
  },
} as const;

/** Event notices (not checkboxes). Shown on the RSVP page. */
export const eventNotices = {
  // Quotes: always shown on the RSVP page.
  quotes: {
    en: "HOEP may quote things said at this event in its newsletter or website without names. We will ask first before using anyone's name.",
    es: "HOEP puede citar, sin nombres, lo que se diga en este evento en su boletín o en su sitio web. Le preguntaremos antes de usar el nombre de cualquier persona.",
  },
  // Recording: only on events marked recorded, and only while the "recordings" toggle is on.
  recorded: {
    en: "This event will be recorded and streamed. Cameras face the presenters, not the audience. Tell us at check-in if you'd like to stay off camera.",
    es: "Este evento se grabará y se transmitirá en vivo. Las cámaras apuntan a quienes presentan, no al público. Avísenos al registrarse si prefiere quedar fuera de cámara.",
  },
  // Same line when live captions are also on (the draft's full wording).
  recordedWithCaptions: {
    en: "This event will be recorded, streamed and shown with live English and Spanish captions. Cameras face the presenters, not the audience. Tell us at check-in if you'd like to stay off camera.",
    es: "Este evento se grabará, se transmitirá en vivo y se mostrará con subtítulos en vivo en inglés y español. Las cámaras apuntan a quienes presentan, no al público. Avísenos al registrarse si prefiere quedar fuera de cámara.",
  },
} as const;

/** Every published version, for traceability. */
export const consentTextVersions = { "draft-1": draft1, "draft-2": draft2, v1, v2, v3 } as const;

/** The wording currently shown (CONSENT_TEXT_VERSION). */
export const consentText = v3;

/** Primary person's consent types (ConsentRecord.type). */
export type ConsentType = "data_and_contact" | "media" | "age_guardian_attestation" | "sms" | "newsletter" | "verification";
/** Adult member's consent types. "adult_attestation" = the member's own "I am 18 or older". */
export type MemberConsentType = "data_and_contact" | "media" | "adult_attestation";
