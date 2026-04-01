import { describe, it, expect, vi, beforeEach } from "vitest";
import { getAIClient } from "@/lib/ai";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";

vi.mock("openai");
vi.mock("@anthropic-ai/sdk");

describe("AI Client Abstraction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.OPENAI_API_KEY = "test-openai-key";
    process.env.ANTHROPIC_API_KEY = "test-anthropic-key";
  });

  describe("getAIClient - Provider Selection", () => {
    it("should return OpenAI client when AI_PROVIDER=openai", () => {
      process.env.AI_PROVIDER = "openai";

      vi.mocked(OpenAI).mockImplementation(
        () =>
          ({
            chat: {
              completions: {
                create: vi.fn(),
              },
            },
          } as any)
      );

      const client = getAIClient();

      expect(client).toBeDefined();
      expect(client.draft).toBeDefined();
      expect(client.detectLanguage).toBeDefined();
      expect(client.isAvailable).toBeDefined();
    });

    it("should return Anthropic client when AI_PROVIDER=anthropic", () => {
      process.env.AI_PROVIDER = "anthropic";

      vi.mocked(Anthropic).mockImplementation(
        () =>
          ({
            messages: {
              create: vi.fn(),
            },
          } as any)
      );

      const client = getAIClient();

      expect(client).toBeDefined();
      expect(client.draft).toBeDefined();
      expect(client.detectLanguage).toBeDefined();
      expect(client.isAvailable).toBeDefined();
    });

    it("should default to OpenAI when AI_PROVIDER not set", () => {
      delete process.env.AI_PROVIDER;

      vi.mocked(OpenAI).mockImplementation(
        () =>
          ({
            chat: {
              completions: {
                create: vi.fn(),
              },
            },
          } as any)
      );

      const client = getAIClient();

      expect(client).toBeDefined();
    });

    it("should throw error when OpenAI API key missing", () => {
      process.env.AI_PROVIDER = "openai";
      delete process.env.OPENAI_API_KEY;

      expect(() => getAIClient()).toThrow(
        "OPENAI_API_KEY environment variable is required"
      );
    });

    it("should throw error when Anthropic API key missing", () => {
      process.env.AI_PROVIDER = "anthropic";
      delete process.env.ANTHROPIC_API_KEY;

      expect(() => getAIClient()).toThrow(
        "ANTHROPIC_API_KEY environment variable is required"
      );
    });
  });

  describe("OpenAI Client - Message Format", () => {
    let mockOpenAI: any;

    beforeEach(() => {
      process.env.AI_PROVIDER = "openai";
      mockOpenAI = {
        chat: {
          completions: {
            create: vi.fn(),
          },
        },
      };
      vi.mocked(OpenAI).mockImplementation(() => mockOpenAI);
    });

    it("should send correct message format to OpenAI API", async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: "This is a drafted response",
            },
          },
        ],
      };
      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);

      const client = getAIClient();
      await client.draft("Draft a response", { systemPrompt: "You are helpful" });

      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          model: expect.any(String),
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: "system",
              content: "You are helpful",
            }),
            expect.objectContaining({
              role: "user",
              content: "Draft a response",
            }),
          ]),
        })
      );
    });

    it("should return drafted text from OpenAI response", async () => {
      const expectedDraft = "Here is the drafted response";
      const mockResponse = {
        choices: [
          {
            message: {
              content: expectedDraft,
            },
          },
        ],
      };
      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);

      const client = getAIClient();
      const result = await client.draft("Draft something");

      expect(result).toBe(expectedDraft);
    });

    it("should use default system prompt when not provided", async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: "Response",
            },
          },
        ],
      };
      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);

      const client = getAIClient();
      await client.draft("Draft this");

      const call = mockOpenAI.chat.completions.create.mock.calls[0][0];
      expect(call.messages[0].content).toContain(
        "helpful assistant for constituent response"
      );
    });

    it("should handle OpenAI rate limit error", async () => {
      mockOpenAI.chat.completions.create.mockRejectedValue(
        new Error("Rate limit exceeded")
      );

      const client = getAIClient();
      const result = await client.draft("Draft");

      expect(result).toBe("");
    });

    it("should handle OpenAI timeout error", async () => {
      mockOpenAI.chat.completions.create.mockRejectedValue(
        new Error("Request timeout")
      );

      const client = getAIClient();
      const result = await client.draft("Draft");

      expect(result).toBe("");
    });
  });

  describe("OpenAI Client - Language Detection", () => {
    let mockOpenAI: any;

    beforeEach(() => {
      process.env.AI_PROVIDER = "openai";
      mockOpenAI = {
        chat: {
          completions: {
            create: vi.fn(),
          },
        },
      };
      vi.mocked(OpenAI).mockImplementation(() => mockOpenAI);
    });

    it("should detect language and return language code", async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: "es",
            },
          },
        ],
      };
      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);

      const client = getAIClient();
      const language = await client.detectLanguage("Hola, cómo estás?");

      expect(language).toBe("es");
    });

    it("should return 'en' for ambiguous or short text", async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: "en",
            },
          },
        ],
      };
      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);

      const client = getAIClient();
      const language = await client.detectLanguage("Hello");

      expect(language).toBe("en");
    });

    it("should default to 'en' on language detection error", async () => {
      mockOpenAI.chat.completions.create.mockRejectedValue(
        new Error("API error")
      );

      const client = getAIClient();
      const language = await client.detectLanguage("Some text");

      expect(language).toBe("en");
    });

    it("should trim and lowercase language code", async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: "  ES  ",
            },
          },
        ],
      };
      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);

      const client = getAIClient();
      const language = await client.detectLanguage("Spanish text");

      expect(language).toBe("es");
    });
  });

  describe("OpenAI Client - Availability Check", () => {
    let mockOpenAI: any;

    beforeEach(() => {
      process.env.AI_PROVIDER = "openai";
      mockOpenAI = {
        chat: {
          completions: {
            create: vi.fn(),
          },
        },
      };
      vi.mocked(OpenAI).mockImplementation(() => mockOpenAI);
    });

    it("should return true when API responds successfully", async () => {
      const mockResponse = {
        choices: [{ message: { content: "pong" } }],
      };
      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);

      const client = getAIClient();
      const available = await client.isAvailable();

      expect(available).toBe(true);
    });

    it("should return false on error", async () => {
      mockOpenAI.chat.completions.create.mockRejectedValue(
        new Error("API unavailable")
      );

      const client = getAIClient();
      const available = await client.isAvailable();

      expect(available).toBe(false);
    });
  });

  describe("Anthropic Client - Message Format", () => {
    let mockAnthropic: any;

    beforeEach(() => {
      process.env.AI_PROVIDER = "anthropic";
      mockAnthropic = {
        messages: {
          create: vi.fn(),
        },
      };
      vi.mocked(Anthropic).mockImplementation(() => mockAnthropic);
    });

    it("should send correct message format to Anthropic API", async () => {
      const mockResponse = {
        content: [
          {
            type: "text",
            text: "Drafted response",
          },
        ],
      };
      mockAnthropic.messages.create.mockResolvedValue(mockResponse);

      const client = getAIClient();
      await client.draft("Draft this", { systemPrompt: "You are helpful" });

      expect(mockAnthropic.messages.create).toHaveBeenCalledWith(
        expect.objectContaining({
          model: expect.any(String),
          max_tokens: expect.any(Number),
          system: "You are helpful",
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: "user",
              content: "Draft this",
            }),
          ]),
        })
      );
    });

    it("should return drafted text from Anthropic response", async () => {
      const expectedDraft = "Here is your drafted response";
      const mockResponse = {
        content: [
          {
            type: "text",
            text: expectedDraft,
          },
        ],
      };
      mockAnthropic.messages.create.mockResolvedValue(mockResponse);

      const client = getAIClient();
      const result = await client.draft("Draft something");

      expect(result).toBe(expectedDraft);
    });

    it("should handle Anthropic rate limit error", async () => {
      mockAnthropic.messages.create.mockRejectedValue(
        new Error("Rate limit exceeded")
      );

      const client = getAIClient();
      const result = await client.draft("Draft");

      expect(result).toBe("");
    });

    it("should handle Anthropic timeout error", async () => {
      mockAnthropic.messages.create.mockRejectedValue(
        new Error("Request timeout")
      );

      const client = getAIClient();
      const result = await client.draft("Draft");

      expect(result).toBe("");
    });
  });

  describe("Anthropic Client - Language Detection", () => {
    let mockAnthropic: any;

    beforeEach(() => {
      process.env.AI_PROVIDER = "anthropic";
      mockAnthropic = {
        messages: {
          create: vi.fn(),
        },
      };
      vi.mocked(Anthropic).mockImplementation(() => mockAnthropic);
    });

    it("should detect language and return language code", async () => {
      const mockResponse = {
        content: [
          {
            type: "text",
            text: "fr",
          },
        ],
      };
      mockAnthropic.messages.create.mockResolvedValue(mockResponse);

      const client = getAIClient();
      const language = await client.detectLanguage("Bonjour, comment ça va?");

      expect(language).toBe("fr");
    });

    it("should return 'en' for ambiguous text", async () => {
      const mockResponse = {
        content: [
          {
            type: "text",
            text: "un",
          },
        ],
      };
      mockAnthropic.messages.create.mockResolvedValue(mockResponse);

      const client = getAIClient();
      const language = await client.detectLanguage("Hi");

      // Should default to 'en' if not a 2-char code
      expect(language).toBe("en");
    });

    it("should default to 'en' on language detection error", async () => {
      mockAnthropic.messages.create.mockRejectedValue(
        new Error("API error")
      );

      const client = getAIClient();
      const language = await client.detectLanguage("Some text");

      expect(language).toBe("en");
    });
  });

  describe("Anthropic Client - Availability Check", () => {
    let mockAnthropic: any;

    beforeEach(() => {
      process.env.AI_PROVIDER = "anthropic";
      mockAnthropic = {
        messages: {
          create: vi.fn(),
        },
      };
      vi.mocked(Anthropic).mockImplementation(() => mockAnthropic);
    });

    it("should return true when API responds successfully", async () => {
      const mockResponse = {
        content: [{ type: "text", text: "pong" }],
      };
      mockAnthropic.messages.create.mockResolvedValue(mockResponse);

      const client = getAIClient();
      const available = await client.isAvailable();

      expect(available).toBe(true);
    });

    it("should return false on error", async () => {
      mockAnthropic.messages.create.mockRejectedValue(
        new Error("API unavailable")
      );

      const client = getAIClient();
      const available = await client.isAvailable();

      expect(available).toBe(false);
    });
  });

  describe("API Configuration", () => {
    it("should use OPENAI_MODEL environment variable when set", () => {
      process.env.AI_PROVIDER = "openai";
      process.env.OPENAI_MODEL = "gpt-4";

      const mockOpenAI = {
        chat: {
          completions: {
            create: vi.fn().mockResolvedValue({
              choices: [{ message: { content: "Response" } }],
            }),
          },
        },
      };
      vi.mocked(OpenAI).mockImplementation(() => mockOpenAI);

      const client = getAIClient();
      client.draft("test");

      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          model: "gpt-4",
        })
      );
    });

    it("should use ANTHROPIC_MODEL environment variable when set", () => {
      process.env.AI_PROVIDER = "anthropic";
      process.env.ANTHROPIC_MODEL = "claude-3-opus-20240229";

      const mockAnthropic = {
        messages: {
          create: vi.fn().mockResolvedValue({
            content: [{ type: "text", text: "Response" }],
          }),
        },
      };
      vi.mocked(Anthropic).mockImplementation(() => mockAnthropic);

      const client = getAIClient();
      client.draft("test");

      expect(mockAnthropic.messages.create).toHaveBeenCalledWith(
        expect.objectContaining({
          model: "claude-3-opus-20240229",
        })
      );
    });
  });
});
