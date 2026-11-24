import { LEGAL_EFFECTIVE_DATE } from "./meta";
import type { LegalDoc } from "./types";

/** Children and Age Policy v2. English is the board-approved text (docs/legal/POLICY_V2_DRAFT.md; v1 is in docs/legal/POLICIES_v1.md and git) and controls. */
export const children: LegalDoc = {
  version: "2",
  effectiveDate: LEGAL_EFFECTIVE_DATE,
  en: {
    title: "Children and Age Policy",
    blocks: [
      {
        t: "p",
        text: "Many of the families HOEP serves have children with bleeding disorders, so we take extra care with children’s information. Children never use our forms themselves; a parent or guardian provides their information.",
      },
      { t: "h2", text: "Who can register" },
      {
        t: "p",
        text: "Only adults 18 or older can register with HOEP or RSVP to events. Everyone who registers confirms that they are 18 or older. This website is not directed to children, and we do not knowingly collect information directly from anyone under 18. If we learn a child registered themselves, we will delete that registration and, where we can, contact a parent or guardian.",
      },
      { t: "h2", text: "Children in a household" },
      {
        t: "p",
        text: "When you register, you may list children under 18 in your household. You confirm that you are their parent or legal guardian, or that you have their guardian’s permission. For each child we collect only:",
      },
      {
        t: "ul",
        items: [
          "First name (last name optional)",
          "Relationship to you",
          "Age group (0–5, 6–12 or 13–17), not a date of birth",
          "If you choose to tell us, whether they have a bleeding disorder, and which one",
        ],
      },
      {
        t: "p",
        text: "We use this to invite your family to events that fit your children, such as youth programs and camps, and to check your family in at events. We never put a child’s health information in an email, link or QR code.",
      },
      { t: "h2", text: "Adults in a household" },
      {
        t: "p",
        text: "An adult in your household speaks for themselves. You may list them, but we ask them directly to confirm their information and give their own consent. You cannot share another adult’s health information. If they don’t confirm within 30 days, we delete what you entered about them.",
      },
      { t: "h2", text: "Photos of children" },
      {
        t: "p",
        text: "We publish photos of children only when their parent or guardian has consented to photo use. At events, board members can see which families declined, so those children are not included in published photos. A parent or guardian can ask us to remove a photo of their child at any time, and we will take it down promptly.",
      },
      { t: "h2", text: "Sign-in, verification, recordings and stories" },
      {
        t: "ul",
        items: [
          "**Signing in.** {STATUS:family_portal} Only adults can sign in to a family page. Children never have accounts.",
          "**Verifying a child’s diagnosis.** {STATUS:verification} A parent or legal guardian can upload a letter for their child. The letter is deleted after review, and only the result is kept.",
          "**Recordings and live streams.** {STATUS:recordings} We keep children whose families declined photo use off camera, and we don’t point cameras at the audience. A parent can ask us to remove any recording that shows their child.",
          "**Stories.** {STATUS:stories} We publish a child’s story or quote only with a parent’s or guardian’s signed permission.",
        ],
      },
      { t: "h2", text: "When a child turns 18" },
      {
        t: "p",
        text: "The age group you entered does not update automatically. When a child in your household turns 18, please let us know. As an adult, they will be asked to confirm their own information and consent, and any information about them that they don’t confirm will be removed.",
      },
      { t: "h2", text: "Your rights as a parent or guardian" },
      {
        t: "p",
        text: "You can review, correct or delete your children’s information at any time, and withdraw photo consent, by contacting us at {EMAIL} or {PHONE}. We respond within 30 days.",
      },
    ],
  },
  es: {
    title: "Política para Menores y Edad",
    blocks: [
      {
        t: "p",
        text: "Muchas de las familias que atiende HOEP tienen hijos con trastornos hemorrágicos, por eso cuidamos de manera especial la información de los menores. Los niños nunca usan nuestros formularios por sí mismos; la información la proporciona un padre, madre o tutor.",
      },
      { t: "h2", text: "Quién puede registrarse" },
      {
        t: "p",
        text: "Solo los adultos de 18 años o más pueden registrarse con HOEP o confirmar su asistencia a los eventos. Todas las personas que se registran confirman que tienen 18 años o más. Este sitio web no está dirigido a menores y no recopilamos a sabiendas información directamente de nadie menor de 18 años. Si nos enteramos de que un menor se registró por su cuenta, borraremos ese registro y, cuando podamos, nos comunicaremos con un padre, madre o tutor.",
      },
      { t: "h2", text: "Menores en un hogar" },
      {
        t: "p",
        text: "Al registrarse, puede incluir a los menores de 18 años de su hogar. Usted confirma que es su padre, madre o tutor legal, o que tiene el permiso de su tutor. De cada menor recopilamos únicamente:",
      },
      {
        t: "ul",
        items: [
          "Nombre (el apellido es opcional)",
          "Parentesco con usted",
          "Grupo de edad (0–5, 6–12 o 13–17), no la fecha de nacimiento",
          "Si usted decide decírnoslo, si tiene un trastorno hemorrágico y cuál",
        ],
      },
      {
        t: "p",
        text: "Usamos esta información para invitar a su familia a eventos adecuados para sus hijos, como programas para jóvenes y campamentos, y para registrar la entrada de su familia a los eventos. Nunca incluimos la información de salud de un menor en un correo, un enlace ni un código QR.",
      },
      { t: "h2", text: "Adultos en un hogar" },
      {
        t: "p",
        text: "Un adulto de su hogar habla por sí mismo. Usted puede incluirlo, pero le pedimos directamente a esa persona que confirme su información y dé su propio consentimiento. Usted no puede compartir la información de salud de otro adulto. Si no confirma en 30 días, borramos lo que usted escribió sobre esa persona.",
      },
      { t: "h2", text: "Fotos de menores" },
      {
        t: "p",
        text: "Solo publicamos fotos de menores cuando su padre, madre o tutor ha dado su consentimiento para el uso de fotos. En los eventos, los miembros de la junta pueden ver qué familias no dieron su consentimiento, para que esos menores no aparezcan en las fotos publicadas. Un padre, madre o tutor puede pedirnos en cualquier momento que retiremos una foto de su hijo o hija, y la quitaremos de inmediato.",
      },
      { t: "h2", text: "Inicio de sesión, verificación, grabaciones e historias" },
      {
        t: "ul",
        items: [
          "**Inicio de sesión.** {STATUS:family_portal} Solo los adultos pueden iniciar sesión en una página familiar. Los menores nunca tienen cuentas.",
          "**Verificación del diagnóstico de un menor.** {STATUS:verification} Un padre, madre o tutor legal puede subir una carta sobre su hijo o hija. La carta se borra después de revisarse y solo se conserva el resultado.",
          "**Grabaciones y transmisiones en vivo.** {STATUS:recordings} Mantenemos fuera de cámara a los menores cuyas familias no aceptaron el uso de fotos, y no apuntamos las cámaras al público. Un padre o madre puede pedirnos que retiremos cualquier grabación en la que aparezca su hijo o hija.",
          "**Historias.** {STATUS:stories} Publicamos la historia o una frase de un menor solo con el permiso firmado de su padre, madre o tutor.",
        ],
      },
      { t: "h2", text: "Cuando un menor cumple 18 años" },
      {
        t: "p",
        text: "El grupo de edad que usted escribió no se actualiza automáticamente. Cuando un menor de su hogar cumpla 18 años, por favor avísenos. Como adulto, se le pedirá que confirme su propia información y dé su consentimiento, y se eliminará cualquier información suya que no confirme.",
      },
      { t: "h2", text: "Sus derechos como padre, madre o tutor" },
      {
        t: "p",
        text: "Puede revisar, corregir o borrar la información de sus hijos en cualquier momento, y retirar el consentimiento para fotos, comunicándose con nosotros en {EMAIL} o al {PHONE}. Respondemos en un plazo de 30 días.",
      },
      {
        t: "p",
        text: "Esta es una traducción para su comodidad. Si hay alguna diferencia entre la versión en español y la versión en inglés, prevalece la versión en inglés.",
      },
    ],
  },
};
