/**
 * Consent wording shown on the "Register for Information" form and the adult
 * confirmation page (recorded, with its version, in ConsentRecord.textVersion
 * every time someone consents).
 *
 * TODO(board): ALL TEXT BELOW IS PLACEHOLDER. The HOEP board must review and
 * approve the final wording (ideally with legal counsel) before the form goes
 * live. When the text changes, add the next version and bump
 * CONSENT_TEXT_VERSION so each ConsentRecord points at exactly the text the
 * person saw. Never edit a published version in place.
 *
 * draft-1: single-person registration (kept so old records stay traceable).
 * draft-2: household registration. NEW, PENDING BOARD APPROVAL:
 *   - data_and_contact / media now speak for the household (primary + minors)
 *   - age_guardian_attestation (primary: 18+, guardian of listed minors)
 *   - member_* texts for adults confirming for themselves at /confirm/[token]
 */
export const CONSENT_TEXT_VERSION = "draft-2";

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

/** Every published version, for traceability. */
export const consentTextVersions = { "draft-1": draft1, "draft-2": draft2 } as const;

/** The wording currently shown (CONSENT_TEXT_VERSION). */
export const consentText = draft2;

/** Primary person's consent types (ConsentRecord.type). */
export type ConsentType = "data_and_contact" | "media" | "age_guardian_attestation";
/** Adult member's consent types. "adult_attestation" = the member's own "I am 18 or older". */
export type MemberConsentType = "data_and_contact" | "media" | "adult_attestation";
