import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  detectLanguage,
  getSupportedLanguages,
  getSupportedLanguagesWithNames,
  getLanguageName,
  isSupportedLanguage,
  normalizeLanguagePreference,
} from "@/lib/language";
import * as aiModule from "@/lib/ai";

vi.mock("@/lib/ai");

describe("Language Utilities", () => {
  const mockAIClient = {
    detectLanguage: vi.fn(),
    draft: vi.fn(),
    isAvailable: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(aiModule.getAIClient).mockReturnValue(mockAIClient);
  });

  describe("detectLanguage - Language Detection", () => {
    it("should identify English text", async () => {
      mockAIClient.detectLanguage.mockResolvedValue("en");

      const language = await detectLanguage("Hello, how are you doing today?");

      expect(language).toBe("en");
      expect(mockAIClient.detectLanguage).toHaveBeenCalledWith(
        "Hello, how are you doing today?"
      );
    });

    it("should identify Spanish text", async () => {
      mockAIClient.detectLanguage.mockResolvedValue("es");

      const language = await detectLanguage("Hola, ¿cómo estás hoy?");

      expect(language).toBe("es");
    });

    it("should identify Chinese text", async () => {
      mockAIClient.detectLanguage.mockResolvedValue("zh");

      const language = await detectLanguage("你好，今天怎么样？");

      expect(language).toBe("zh");
    });

    it("should identify French text", async () => {
      mockAIClient.detectLanguage.mockResolvedValue("fr");

      const language = await detectLanguage("Bonjour, comment allez-vous?");

      expect(language).toBe("fr");
    });

    it("should identify German text", async () => {
      mockAIClient.detectLanguage.mockResolvedValue("de");

      const language = await detectLanguage("Hallo, wie geht es dir?");

      expect(language).toBe("de");
    });

    it("should identify Portuguese text", async () => {
      mockAIClient.detectLanguage.mockResolvedValue("pt");

      const language = await detectLanguage("Olá, como você está?");

      expect(language).toBe("pt");
    });

    it("should identify Vietnamese text", async () => {
      mockAIClient.detectLanguage.mockResolvedValue("vi");

      const language = await detectLanguage("Xin chào, bạn khỏe không?");

      expect(language).toBe("vi");
    });

    it("should identify Arabic text", async () => {
      mockAIClient.detectLanguage.mockResolvedValue("ar");

      const language = await detectLanguage("مرحبا، كيف حالك؟");

      expect(language).toBe("ar");
    });

    it("should identify Korean text", async () => {
      mockAIClient.detectLanguage.mockResolvedValue("ko");

      const language = await detectLanguage("안녕하세요, 어떻게 지내세요?");

      expect(language).toBe("ko");
    });

    it("should identify Tagalog text", async () => {
      mockAIClient.detectLanguage.mockResolvedValue("tl");

      const language = await detectLanguage("Kamusta, paano ka?");

      expect(language).toBe("tl");
    });

    it("should return 'en' for ambiguous or short text", async () => {
      mockAIClient.detectLanguage.mockResolvedValue("en");

      const language = await detectLanguage("Hi");

      expect(language).toBe("en");
    });

    it("should return 'en' for empty text", async () => {
      const language = await detectLanguage("");

      expect(language).toBe("en");
      expect(mockAIClient.detectLanguage).not.toHaveBeenCalled();
    });

    it("should return 'en' for whitespace only text", async () => {
      const language = await detectLanguage("   ");

      expect(language).toBe("en");
      expect(mockAIClient.detectLanguage).not.toHaveBeenCalled();
    });

    it("should handle AI detection error gracefully", async () => {
      mockAIClient.detectLanguage.mockRejectedValue(
        new Error("AI service error")
      );

      const language = await detectLanguage("Some text");

      expect(language).toBe("en");
    });

    it("should validate returned language is supported", async () => {
      mockAIClient.detectLanguage.mockResolvedValue("unsupported-lang");

      const language = await detectLanguage("Some text");

      expect(language).toBe("en");
    });

    it("should trim whitespace from detected text", async () => {
      mockAIClient.detectLanguage.mockResolvedValue("es");

      const language = await detectLanguage("   Hola   ");

      expect(mockAIClient.detectLanguage).toHaveBeenCalledWith("Hola");
    });
  });

  describe("getSupportedLanguages - Language List", () => {
    it("should return correct list of supported language codes", () => {
      const languages = getSupportedLanguages();

      expect(languages).toContain("en");
      expect(languages).toContain("es");
      expect(languages).toContain("fr");
      expect(languages).toContain("zh");
      expect(languages).toContain("vi");
      expect(languages).toContain("ar");
      expect(languages).toContain("ko");
      expect(languages).toContain("tl");
      expect(languages).toContain("de");
      expect(languages).toContain("ja");
      expect(languages).toContain("pt");
      expect(languages).toContain("it");
      expect(languages).toContain("ru");
      expect(languages).toContain("pl");
      expect(languages).toContain("tr");
    });

    it("should return array of strings", () => {
      const languages = getSupportedLanguages();

      expect(Array.isArray(languages)).toBe(true);
      expect(languages.every((lang) => typeof lang === "string")).toBe(true);
    });

    it("should contain at least English", () => {
      const languages = getSupportedLanguages();

      expect(languages).toContain("en");
    });
  });

  describe("getSupportedLanguagesWithNames - Language Names", () => {
    it("should return array of language code and name pairs", () => {
      const languages = getSupportedLanguagesWithNames();

      expect(Array.isArray(languages)).toBe(true);
      expect(languages.length).toBeGreaterThan(0);

      languages.forEach((lang) => {
        expect(lang).toHaveProperty("code");
        expect(lang).toHaveProperty("name");
        expect(typeof lang.code).toBe("string");
        expect(typeof lang.name).toBe("string");
      });
    });

    it("should include proper display names", () => {
      const languages = getSupportedLanguagesWithNames();

      expect(
        languages.some((l) => l.code === "en" && l.name === "English")
      ).toBe(true);
      expect(
        languages.some((l) => l.code === "es" && l.name === "Spanish")
      ).toBe(true);
      expect(
        languages.some((l) => l.code === "fr" && l.name === "French")
      ).toBe(true);
    });

    it("should have matching codes with getSupportedLanguages", () => {
      const codes = getSupportedLanguages();
      const withNames = getSupportedLanguagesWithNames();

      const codeSet = new Set(codes);
      const namesSet = new Set(withNames.map((l) => l.code));

      expect(codeSet).toEqual(namesSet);
    });
  });

  describe("getLanguageName - Human Readable Names", () => {
    it("should return correct name for English code", () => {
      const name = getLanguageName("en");

      expect(name).toBe("English");
    });

    it("should return correct name for Spanish code", () => {
      const name = getLanguageName("es");

      expect(name).toBe("Spanish");
    });

    it("should return correct name for Chinese code", () => {
      const name = getLanguageName("zh");

      expect(name).toBe("Chinese");
    });

    it("should return correct name for Vietnamese code", () => {
      const name = getLanguageName("vi");

      expect(name).toBe("Vietnamese");
    });

    it("should return correct name for Arabic code", () => {
      const name = getLanguageName("ar");

      expect(name).toBe("Arabic");
    });

    it("should return correct name for all supported languages", () => {
      const languages = getSupportedLanguages();

      languages.forEach((code) => {
        const name = getLanguageName(code);
        expect(name).not.toBe("Unknown");
        expect(name.length).toBeGreaterThan(0);
      });
    });

    it("should return 'Unknown' for unsupported language code", () => {
      const name = getLanguageName("xyz");

      expect(name).toBe("Unknown");
    });

    it("should be case-sensitive for language codes", () => {
      const name = getLanguageName("EN");

      expect(name).toBe("Unknown");
    });
  });

  describe("isSupportedLanguage - Language Validation", () => {
    it("should return true for supported language", () => {
      expect(isSupportedLanguage("en")).toBe(true);
      expect(isSupportedLanguage("es")).toBe(true);
      expect(isSupportedLanguage("zh")).toBe(true);
    });

    it("should return false for unsupported language", () => {
      expect(isSupportedLanguage("xyz")).toBe(false);
      expect(isSupportedLanguage("unsupported")).toBe(false);
    });

    it("should be case-sensitive", () => {
      expect(isSupportedLanguage("en")).toBe(true);
      expect(isSupportedLanguage("EN")).toBe(false);
      expect(isSupportedLanguage("En")).toBe(false);
    });

    it("should return false for empty string", () => {
      expect(isSupportedLanguage("")).toBe(false);
    });

    it("should return false for null or undefined", () => {
      expect(isSupportedLanguage(null as any)).toBe(false);
      expect(isSupportedLanguage(undefined as any)).toBe(false);
    });
  });

  describe("normalizeLanguagePreference - Preference Normalization", () => {
    it("should normalize language code (already normalized)", () => {
      const normalized = normalizeLanguagePreference("es");

      expect(normalized).toBe("es");
    });

    it("should normalize language name to code", () => {
      const normalized = normalizeLanguagePreference("Spanish");

      expect(normalized).toBe("es");
    });

    it("should normalize language name to code case-insensitively", () => {
      const normalized1 = normalizeLanguagePreference("english");
      const normalized2 = normalizeLanguagePreference("ENGLISH");
      const normalized3 = normalizeLanguagePreference("English");

      expect(normalized1).toBe("en");
      expect(normalized2).toBe("en");
      expect(normalized3).toBe("en");
    });

    it("should normalize code case-insensitively for already-lowercase names", () => {
      const normalized = normalizeLanguagePreference("chinese");

      expect(normalized).toBe("zh");
    });

    it("should return null for unsupported language", () => {
      const normalized = normalizeLanguagePreference("Klingon");

      expect(normalized).toBeNull();
    });

    it("should return null for empty string", () => {
      const normalized = normalizeLanguagePreference("");

      expect(normalized).toBeNull();
    });

    it("should handle all supported language codes", () => {
      const codes = getSupportedLanguages();

      codes.forEach((code) => {
        const normalized = normalizeLanguagePreference(code);
        expect(normalized).toBe(code);
      });
    });

    it("should handle all supported language names", () => {
      const languages = getSupportedLanguagesWithNames();

      languages.forEach((lang) => {
        const normalized = normalizeLanguagePreference(lang.name);
        expect(normalized).toBe(lang.code);
      });
    });

    it("should trim whitespace", () => {
      const normalized = normalizeLanguagePreference("  es  ");

      expect(normalized).toBe("es");
    });
  });

  describe("Language Detection Integration", () => {
    it("should use AI client from getAIClient", async () => {
      mockAIClient.detectLanguage.mockResolvedValue("es");

      await detectLanguage("Hola");

      expect(aiModule.getAIClient).toHaveBeenCalled();
      expect(mockAIClient.detectLanguage).toHaveBeenCalled();
    });

    it("should validate detected language is in supported list", async () => {
      mockAIClient.detectLanguage.mockResolvedValue("xx");

      const language = await detectLanguage("Some text");

      expect(language).toBe("en");
    });

    it("should call AI client with exact text passed", async () => {
      mockAIClient.detectLanguage.mockResolvedValue("en");

      const testText = "This is a test message";
      await detectLanguage(testText);

      expect(mockAIClient.detectLanguage).toHaveBeenCalledWith(testText);
    });
  });

  describe("Supported Languages List Completeness", () => {
    it("should include all major world languages", () => {
      const languages = getSupportedLanguages();

      const requiredLanguages = [
        "en", // English
        "es", // Spanish
        "fr", // French
        "de", // German
        "it", // Italian
        "pt", // Portuguese
        "ru", // Russian
        "ar", // Arabic
        "zh", // Chinese
        "ja", // Japanese
        "ko", // Korean
        "vi", // Vietnamese
      ];

      requiredLanguages.forEach((lang) => {
        expect(languages).toContain(lang);
      });
    });

    it("should have consistent length between languages and names", () => {
      const languages = getSupportedLanguages();
      const withNames = getSupportedLanguagesWithNames();

      expect(languages.length).toBe(withNames.length);
    });
  });

  describe("Edge Cases", () => {
    it("should handle mixed language text", async () => {
      mockAIClient.detectLanguage.mockResolvedValue("en");

      const language = await detectLanguage(
        "Hello mundo, bonjour the world"
      );

      expect(language).toBe("en");
    });

    it("should handle text with special characters", async () => {
      mockAIClient.detectLanguage.mockResolvedValue("en");

      const language = await detectLanguage(
        "Hello!!! @#$% &^* world??? 123"
      );

      expect(language).toBe("en");
    });

    it("should handle very long text", async () => {
      mockAIClient.detectLanguage.mockResolvedValue("en");

      const longText = "Hello ".repeat(1000);
      const language = await detectLanguage(longText);

      expect(language).toBe("en");
    });

    it("should handle text with only numbers", async () => {
      mockAIClient.detectLanguage.mockResolvedValue("en");

      const language = await detectLanguage("123456789");

      expect(language).toBe("en");
    });
  });
});
