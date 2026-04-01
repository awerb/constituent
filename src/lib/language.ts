import { getAIClient } from "@/lib/ai";

// Supported languages with their codes and names
const SUPPORTED_LANGUAGES = {
  en: "English",
  es: "Spanish",
  fr: "French",
  zh: "Chinese",
  vi: "Vietnamese",
  ar: "Arabic",
  ko: "Korean",
  tl: "Tagalog",
  de: "German",
  ja: "Japanese",
  pt: "Portuguese",
  it: "Italian",
  ru: "Russian",
  pl: "Polish",
  tr: "Turkish",
};

/**
 * Detect language from text using AI
 * Falls back to "en" if detection fails
 */
export async function detectLanguage(text: string): Promise<string> {
  if (!text || text.trim().length === 0) {
    return "en";
  }

  try {
    const aiClient = getAIClient();
    const detectedLanguage = await aiClient.detectLanguage(text);

    // Validate that it's a supported language
    if (detectedLanguage in SUPPORTED_LANGUAGES) {
      return detectedLanguage;
    }

    return "en";
  } catch (error) {
    console.error("Language detection failed:", error);
    return "en";
  }
}

/**
 * Get list of supported language codes
 */
export function getSupportedLanguages(): string[] {
  return Object.keys(SUPPORTED_LANGUAGES);
}

/**
 * Get list of supported languages with their names
 */
export function getSupportedLanguagesWithNames(): Array<{
  code: string;
  name: string;
}> {
  return Object.entries(SUPPORTED_LANGUAGES).map(([code, name]) => ({
    code,
    name,
  }));
}

/**
 * Get the display name for a language code
 */
export function getLanguageName(code: string): string {
  return SUPPORTED_LANGUAGES[code as keyof typeof SUPPORTED_LANGUAGES] || "Unknown";
}

/**
 * Check if a language code is supported
 */
export function isSupportedLanguage(code: string): code is keyof typeof SUPPORTED_LANGUAGES {
  return code in SUPPORTED_LANGUAGES;
}

/**
 * Get language from preference string (e.g., "es" or "Spanish")
 * Returns language code or null if not found
 */
export function normalizeLanguagePreference(preference: string): string | null {
  const lowerPref = preference.toLowerCase();

  // Check if it's already a code
  if (lowerPref in SUPPORTED_LANGUAGES) {
    return lowerPref;
  }

  // Check if it's a language name
  for (const [code, name] of Object.entries(SUPPORTED_LANGUAGES)) {
    if (name.toLowerCase() === lowerPref) {
      return code;
    }
  }

  return null;
}
