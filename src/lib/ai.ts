import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";

export interface AIClient {
  draft(prompt: string, context?: Record<string, unknown>): Promise<string>;
  detectLanguage(text: string): Promise<string>;
  isAvailable(): Promise<boolean>;
}

class OpenAIClient implements AIClient {
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  async draft(prompt: string, context?: Record<string, unknown>): Promise<string> {
    try {
      const systemPrompt = context?.systemPrompt
        ? String(context.systemPrompt)
        : "You are a helpful assistant for constituent response management. Provide clear, professional, and compassionate responses.";

      const response = await this.client.chat.completions.create({
        model: process.env.OPENAI_MODEL || "gpt-4-turbo",
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      });

      return response.choices[0]?.message?.content || "";
    } catch (error) {
      console.error("OpenAI draft error:", error);
      return "";
    }
  }

  async detectLanguage(text: string): Promise<string> {
    try {
      const response = await this.client.chat.completions.create({
        model: process.env.OPENAI_MODEL || "gpt-4-turbo",
        messages: [
          {
            role: "system",
            content:
              'Detect the language of the given text. Respond with only the ISO 639-1 language code (e.g., "en", "es", "fr").',
          },
          {
            role: "user",
            content: text,
          },
        ],
        temperature: 0.3,
        max_tokens: 10,
      });

      const result = (response.choices[0]?.message?.content || "en").trim().toLowerCase();
      return result.length === 2 ? result : "en";
    } catch (error) {
      console.error("OpenAI language detection error:", error);
      return "en";
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await this.client.chat.completions.create({
        model: process.env.OPENAI_MODEL || "gpt-4-turbo",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant.",
          },
          {
            role: "user",
            content: "ping",
          },
        ],
        temperature: 0,
        max_tokens: 1,
      });

      return !!response.choices[0];
    } catch (error) {
      console.error("OpenAI availability check error:", error);
      return false;
    }
  }
}

class AnthropicClient implements AIClient {
  private client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  async draft(prompt: string, context?: Record<string, unknown>): Promise<string> {
    try {
      const systemPrompt = context?.systemPrompt
        ? String(context.systemPrompt)
        : "You are a helpful assistant for constituent response management. Provide clear, professional, and compassionate responses.";

      const response = await this.client.messages.create({
        model: process.env.ANTHROPIC_MODEL || "claude-3-sonnet-20240229",
        max_tokens: 2000,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      });

      return response.content[0]?.type === "text" ? response.content[0].text : "";
    } catch (error) {
      console.error("Anthropic draft error:", error);
      return "";
    }
  }

  async detectLanguage(text: string): Promise<string> {
    try {
      const response = await this.client.messages.create({
        model: process.env.ANTHROPIC_MODEL || "claude-3-sonnet-20240229",
        max_tokens: 10,
        system:
          'Detect the language of the given text. Respond with only the ISO 639-1 language code (e.g., "en", "es", "fr").',
        messages: [
          {
            role: "user",
            content: text,
          },
        ],
      });

      const result = (
        response.content[0]?.type === "text" ? response.content[0].text : "en"
      )
        .trim()
        .toLowerCase();
      return result.length === 2 ? result : "en";
    } catch (error) {
      console.error("Anthropic language detection error:", error);
      return "en";
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await this.client.messages.create({
        model: process.env.ANTHROPIC_MODEL || "claude-3-sonnet-20240229",
        max_tokens: 1,
        messages: [
          {
            role: "user",
            content: "ping",
          },
        ],
      });

      return !!response.content[0];
    } catch (error) {
      console.error("Anthropic availability check error:", error);
      return false;
    }
  }
}

export function getAIClient(): AIClient {
  const provider = (process.env.AI_PROVIDER || "openai").toLowerCase();

  if (provider === "anthropic") {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY environment variable is required");
    }
    return new AnthropicClient(apiKey);
  }

  // Default to OpenAI
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY environment variable is required");
  }
  return new OpenAIClient(apiKey);
}
