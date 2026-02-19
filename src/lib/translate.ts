interface TranslationResult {
  translatedText: string;
  detectedLanguage: string;
}

export async function translateText(
  text: string,
  targetLang: "en" | "es",
): Promise<TranslationResult> {
  // TODO: Integrate Google Translate API
  // For now, return placeholder
  console.log(`[Translation needed] "${text}" -> ${targetLang}`);

  return {
    translatedText: `[${targetLang.toUpperCase()}] ${text}`,
    detectedLanguage: targetLang === "en" ? "es" : "en",
  };
}

export async function detectLanguage(text: string): Promise<"en" | "es"> {
  // Simple heuristic for now
  const spanishWords = [
    "qué",
    "cómo",
    "cuándo",
    "dónde",
    "por",
    "para",
    "es",
    "la",
    "el",
  ];
  const lowerText = text.toLowerCase();

  const spanishMatches = spanishWords.filter((word) =>
    lowerText.includes(word),
  ).length;

  return spanishMatches > 2 ? "es" : "en";
}
