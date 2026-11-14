/**
 * Consent wording shown on the "Register for Information" form (and recorded,
 * with its version, in ConsentRecord.textVersion every time someone consents).
 *
 * TODO(board): THIS IS PLACEHOLDER TEXT. The HOEP board must review and approve
 * the final wording (ideally with legal counsel) before the form goes live.
 * When the text changes, bump CONSENT_TEXT_VERSION so each ConsentRecord points
 * at exactly the text the person saw. Never edit a published version in place.
 */
export const CONSENT_TEXT_VERSION = "draft-1";

export const consentText = {
  data_and_contact: {
    en: "I agree that Hemophilia Outreach of El Paso (HOEP) may store the information I provide, and may contact me by email, phone, or mail about HOEP events and services. I can ask HOEP to delete my information at any time. [DRAFT - pending board approval]",
    es: "Acepto que Hemophilia Outreach of El Paso (HOEP) guarde la información que proporciono y se comunique conmigo por correo electrónico, teléfono o correo postal sobre eventos y servicios de HOEP. Puedo pedir a HOEP que elimine mi información en cualquier momento. [BORRADOR - pendiente de aprobación de la junta]",
  },
  media: {
    en: "I agree that HOEP may use photos or video that include me or my family at HOEP events in its materials and on its website and social media. This is optional. [DRAFT - pending board approval]",
    es: "Acepto que HOEP pueda usar fotos o videos en los que aparezcamos mi familia o yo en eventos de HOEP, en sus materiales, sitio web y redes sociales. Esto es opcional. [BORRADOR - pendiente de aprobación de la junta]",
  },
} as const;

export type ConsentType = keyof typeof consentText;
