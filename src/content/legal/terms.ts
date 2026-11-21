import { LEGAL_EFFECTIVE_DATE } from "./meta";
import type { LegalDoc } from "./types";

/**
 * Terms of Use v1. English is the board-approved text (docs/legal/POLICIES_v1.md) and controls.
 * "{HOST}" renders from SITE_URL's host (lib/site.ts).
 */
export const terms: LegalDoc = {
  version: "1",
  effectiveDate: LEGAL_EFFECTIVE_DATE,
  en: {
    title: "Terms of Use",
    blocks: [
      {
        t: "p",
        text: "By using {HOST} you agree to these terms. If you don’t agree, please don’t use the site.",
      },
      { t: "h2", text: "Not medical advice" },
      {
        t: "p",
        text: "Information on this site, including about bleeding disorders, treatment centers and programs, is for general education only. It is not medical advice and does not replace your doctor or hemophilia treatment center. In an emergency, call 911.",
      },
      { t: "h2", text: "Registering and RSVPs" },
      {
        t: "ul",
        items: [
          "You must be 18 or older to register, and the information you give must be accurate.",
          "Only register people you are allowed to: yourself, minors you are the parent or legal guardian of (or have their guardian’s permission for), and other adults in your household, who will be asked to confirm for themselves.",
          "Your RSVP and invitation links are private. Please don’t share them; anyone with the link can view or change that RSVP.",
          "Events can have limited space. RSVPs are first come, first served, and HOEP may change or cancel an event. We will let RSVPed families know.",
        ],
      },
      { t: "h2", text: "At our events" },
      {
        t: "p",
        text: "HOEP may take photos and video at events. We publish images only of people who consented to photo use. If you see an image of you or your child that you want removed, contact us and we will take it down.",
      },
      { t: "h2", text: "Acceptable use" },
      {
        t: "p",
        text: "Don’t use the site or its forms to send spam, advertising or harmful content, to try to access information that isn’t yours, or to interfere with how the site works. We may block submissions that break these rules.",
      },
      { t: "h2", text: "Links to other websites" },
      {
        t: "p",
        text: "We link to other organizations, such as national bleeding disorder foundations and local providers. We aren’t responsible for their content or privacy practices.",
      },
      { t: "h2", text: "HOEP’s content" },
      {
        t: "p",
        text: "The HOEP name, logo and site content belong to HOEP. You may share our pages and event information for non-commercial purposes; please don’t alter our logo or use it to suggest HOEP endorses something.",
      },
      { t: "h2", text: "No warranty" },
      {
        t: "p",
        text: "We work to keep the site accurate and available, but it is provided “as is”, and we can’t promise it will always be error-free or online. To the extent the law allows, HOEP is not liable for losses from using the site.",
      },
      { t: "h2", text: "Governing law" },
      { t: "p", text: "These terms are governed by the laws of the State of Texas." },
      { t: "h2", text: "Changes" },
      {
        t: "p",
        text: "We may update these terms. The current version and its effective date will always be on this page.",
      },
      { t: "h2", text: "Contact" },
      { t: "p", text: "{EMAIL} · {PHONE}" },
    ],
  },
  es: {
    title: "Términos de Uso",
    blocks: [
      {
        t: "p",
        text: "Al usar {HOST}, usted acepta estos términos. Si no está de acuerdo, por favor no use el sitio.",
      },
      { t: "h2", text: "No es consejo médico" },
      {
        t: "p",
        text: "La información de este sitio, incluida la que trata de los trastornos hemorrágicos, los centros de tratamiento y los programas, es solo para educación general. No es consejo médico y no reemplaza a su médico ni a su centro de tratamiento de hemofilia. En caso de emergencia, llame al 911.",
      },
      { t: "h2", text: "Registro y confirmación de asistencia" },
      {
        t: "ul",
        items: [
          "Debe tener 18 años o más para registrarse, y la información que proporcione debe ser correcta.",
          "Registre solo a las personas que le corresponde registrar: usted mismo, los menores de quienes usted es padre, madre o tutor legal (o tiene el permiso de su tutor), y otros adultos de su hogar, a quienes se les pedirá que confirmen por sí mismos.",
          "Sus enlaces de confirmación de asistencia y de invitación son privados. Por favor, no los comparta; cualquier persona con el enlace puede ver o cambiar esa confirmación.",
          "Los eventos pueden tener cupo limitado. Las confirmaciones se atienden por orden de llegada, y HOEP puede cambiar o cancelar un evento. Se lo haremos saber a las familias que hayan confirmado.",
        ],
      },
      { t: "h2", text: "En nuestros eventos" },
      {
        t: "p",
        text: "HOEP puede tomar fotos y videos en los eventos. Solo publicamos imágenes de personas que dieron su consentimiento para el uso de fotos. Si ve una imagen suya o de su hijo o hija que desea que retiremos, comuníquese con nosotros y la quitaremos.",
      },
      { t: "h2", text: "Uso aceptable" },
      {
        t: "p",
        text: "No use el sitio ni sus formularios para enviar spam, publicidad o contenido dañino, para intentar acceder a información que no es suya, ni para interferir con el funcionamiento del sitio. Podemos bloquear envíos que incumplan estas reglas.",
      },
      { t: "h2", text: "Enlaces a otros sitios web" },
      {
        t: "p",
        text: "Incluimos enlaces a otras organizaciones, como fundaciones nacionales de trastornos hemorrágicos y proveedores locales. No somos responsables de su contenido ni de sus prácticas de privacidad.",
      },
      { t: "h2", text: "Contenido de HOEP" },
      {
        t: "p",
        text: "El nombre, el logotipo y el contenido del sitio pertenecen a HOEP. Puede compartir nuestras páginas y la información de los eventos con fines no comerciales; por favor, no altere nuestro logotipo ni lo use para dar a entender que HOEP respalda algo.",
      },
      { t: "h2", text: "Sin garantía" },
      {
        t: "p",
        text: "Nos esforzamos por mantener el sitio correcto y disponible, pero se ofrece “tal como está” y no podemos prometer que siempre estará libre de errores ni en línea. En la medida en que la ley lo permita, HOEP no es responsable por pérdidas derivadas del uso del sitio.",
      },
      { t: "h2", text: "Ley aplicable" },
      { t: "p", text: "Estos términos se rigen por las leyes del Estado de Texas." },
      { t: "h2", text: "Cambios" },
      {
        t: "p",
        text: "Podemos actualizar estos términos. La versión vigente y su fecha de vigencia siempre estarán en esta página.",
      },
      { t: "h2", text: "Contacto" },
      { t: "p", text: "{EMAIL} · {PHONE}" },
      {
        t: "p",
        text: "Esta es una traducción para su comodidad. Si hay alguna diferencia entre la versión en español y la versión en inglés, prevalece la versión en inglés.",
      },
    ],
  },
};
