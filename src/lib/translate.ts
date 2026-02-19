import * as deepl from "deepl-node";

let translator: deepl.Translator | null = null;

function getTranslator(): deepl.Translator {
  if (translator) return translator;

  if (!process.env.DEEPL_API_KEY) {
    throw new Error("DEEPL_API_KEY not configured");
  }

  translator = new deepl.Translator(process.env.DEEPL_API_KEY);
  return translator;
}

export interface TranslationResult {
  originalText: string;
  translatedText: string;
  originalLang: string;
  targetLang: string;
}

export async function translateText(
  text: string,
  targetLang: "en" | "es",
): Promise<TranslationResult> {
  try {
    const translator = getTranslator();

    // DeepL language codes: 'en-US' for English, 'es' for Spanish
    const deeplTarget = targetLang === "en" ? "en-US" : "es";

    const result = await translator.translateText(text, null, deeplTarget);

    return {
      originalText: text,
      translatedText: result.text,
      originalLang: result.detectedSourceLang.toLowerCase(),
      targetLang,
    };
  } catch (error) {
    console.error("DeepL translation error:", error);
    throw new Error("Translation failed");
  }
}

export async function detectLanguage(text: string): Promise<string> {
  try {
    // DeepL doesn't have a separate detect endpoint
    // So we do a test translation and check detected language
    const translator = getTranslator();
    const result = await translator.translateText(text, null, "en-US");
    return result.detectedSourceLang.toLowerCase();
  } catch (error) {
    console.error("Language detection error:", error);
    // Fallback: simple heuristic
    const spanishChars = /[áéíóúñ¿¡]/i;
    return spanishChars.test(text) ? "es" : "en";
  }
}

export async function translateBilingual(
  text: string,
): Promise<{ en: string; es: string; originalLang: string }> {
  try {
    const translator = getTranslator();

    // Translate to both languages
    const toEnglish = await translator.translateText(text, null, "en-US");
    const toSpanish = await translator.translateText(text, null, "es");

    const detectedLang = toEnglish.detectedSourceLang.toLowerCase();

    // If original was English, use original for EN
    if (detectedLang === "en") {
      return {
        en: text,
        es: toSpanish.text,
        originalLang: "en",
      };
    }
    // If original was Spanish, use original for ES
    else if (detectedLang === "es") {
      return {
        en: toEnglish.text,
        es: text,
        originalLang: "es",
      };
    }
    // Other language detected, translate both
    else {
      return {
        en: toEnglish.text,
        es: toSpanish.text,
        originalLang: detectedLang,
      };
    }
  } catch (error) {
    console.error("Bilingual translation error:", error);
    throw new Error("Bilingual translation failed");
  }
}

// Usage tracking helper (DeepL free tier is 500k chars/month)
export async function getUsageStats(): Promise<{
  used: number;
  limit: number;
}> {
  try {
    const translator = getTranslator();
    const usage = await translator.getUsage();

    return {
      used: usage.character?.count || 0,
      limit: usage.character?.limit || 500000,
    };
  } catch (error) {
    console.error("Usage stats error:", error);
    return { used: 0, limit: 500000 };
  }
}
