import type { Lang } from "@/types";

export const addressTranslation: Record<Lang, {
  line1: string; line2: string; line2Hint: string; city: string; state: string; zip: string; zipHint: string;
  usOnly: string; suggestionsFromGoogle: string; errors: Record<string, string>; unstructuredNote: string;
}> = {
  en: {
    line1: "Street address", line2: "Apartment, suite or unit", line2Hint: "optional", city: "City", state: "State", zip: "ZIP code",
    zipHint: "5 digits. We fill in the city and state for you.",
    usOnly: "We can only use addresses in the United States.",
    suggestionsFromGoogle: "Address suggestions come from Google.",
    errors: { addressLine1: "Enter the street address.", city: "Enter the city.", state: "Choose a state.", zip: "Enter a 5-digit ZIP code." },
    unstructuredNote: "The address on file was entered as one line. Please enter it again in the boxes below.",
  },
  es: {
    line1: "Dirección", line2: "Apartamento, suite o unidad", line2Hint: "opcional", city: "Ciudad", state: "Estado", zip: "Código postal (ZIP)",
    zipHint: "5 dígitos. Llenamos la ciudad y el estado por usted.",
    usOnly: "Solo podemos usar direcciones de los Estados Unidos.",
    suggestionsFromGoogle: "Las sugerencias de direcciones vienen de Google.",
    errors: { addressLine1: "Escriba la dirección.", city: "Escriba la ciudad.", state: "Elija un estado.", zip: "Escriba un código postal de 5 dígitos." },
    unstructuredNote: "La dirección guardada se escribió en una sola línea. Por favor escríbala de nuevo en las casillas de abajo.",
  },
};
