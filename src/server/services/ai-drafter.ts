import { prisma } from "@/lib/db";
import { getAIClient } from "@/lib/ai";

export interface DraftResponseParams {
  cityId: string;
  caseId: string;
  tone?: "formal" | "friendly" | "empathetic" | "technical";
}

export interface DraftResponseResult {
  draft: string;
  language: string;
}

export class AIDraftError extends Error {
  constructor(
    message: string,
    public code: string
  ) {
    super(message);
    this.name = "AIDraftError";
  }
}

/**
 * Draft an AI response to a case based on context
 * Gathers all relevant information and uses AI to generate a professional response
 */
export async function draftResponse(
  params: DraftResponseParams
): Promise<DraftResponseResult> {
  try {
    const { cityId, caseId, tone = "professional" } = params;

    console.log(`Drafting response for case ${caseId}`);

    // Check AI availability
    const aiClient = getAIClient();
    const isAvailable = await aiClient.isAvailable();

    if (!isAvailable) {
      throw new AIDraftError(
        "AI service is currently unavailable",
        "AI_UNAVAILABLE"
      );
    }

    // Gather case context
    const caseRecord = await prisma.case.findUniqueOrThrow({
      where: { id: caseId },
      include: {
        constituent: true,
        department: true,
        messages: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        newsletterItem: true,
      },
    });

    const city = await prisma.city.findUniqueOrThrow({
      where: { id: cityId },
    });

    // Get relevant template if available
    let template = null;
    if (caseRecord.department.id) {
      template = await prisma.template.findFirst({
        where: {
          cityId,
          departmentId: caseRecord.department.id,
          status: "APPROVED",
        },
        orderBy: { createdAt: "desc" },
      });
    }

    // Build conversation context from messages
    const conversationHistory = caseRecord.messages
      .reverse()
      .map(
        (msg) =>
          `${msg.authorType} (${msg.createdAt.toISOString()}): ${msg.content}`
      )
      .join("\n\n");

    // Build system prompt
    const systemPrompt = buildSystemPrompt({
      cityName: city.name,
      departmentName: caseRecord.department.name,
      tone,
      templateGuidance: template?.content,
    });

    // Build user prompt with all context
    const userPrompt = buildUserPrompt({
      caseSubject: caseRecord.subject,
      caseDescription: caseRecord.description,
      constituentName: caseRecord.constituent.name || caseRecord.constituent.email,
      constituentLanguage: caseRecord.constituent.languagePreference,
      conversationHistory,
      newsletterContext: caseRecord.newsletterItem
        ? `This case is related to newsletter item: "${caseRecord.newsletterItem.title}"`
        : null,
    });

    // Call AI
    const draft = await aiClient.draft(userPrompt, {
      systemPrompt,
    });

    if (!draft) {
      throw new AIDraftError("AI generated empty response", "EMPTY_RESPONSE");
    }

    // Detect response language
    const language = await aiClient.detectLanguage(draft);

    console.log(`Draft generated successfully (language: ${language})`);

    return {
      draft,
      language,
    };
  } catch (error) {
    if (error instanceof AIDraftError) {
      console.error(`AI Draft Error: ${error.code} - ${error.message}`);
      throw error;
    }

    console.error("Error drafting response:", error);
    throw new AIDraftError(
      "Failed to draft response",
      "DRAFT_FAILED"
    );
  }
}

/**
 * Build system prompt with context and instructions
 */
function buildSystemPrompt(context: {
  cityName: string;
  departmentName: string;
  tone: string;
  templateGuidance?: string | null;
}): string {
  let prompt = `You are a professional constituent response writer for the ${context.cityName} government's ${context.departmentName}.

Your response should be:
- Clear and accessible to the average citizen
- Accurate and factual
- Respectful and professional
- ${getToneDescription(context.tone)}

Important guidelines:
- Always maintain a helpful and service-oriented tone
- Do not make promises that cannot be kept
- Explain processes clearly
- Provide next steps when applicable
- Be concise but thorough`;

  if (context.templateGuidance) {
    prompt += `

\nUse this template as a reference for structure and style:
${context.templateGuidance}`;
  }

  return prompt;
}

/**
 * Get tone description for system prompt
 */
function getToneDescription(tone: string): string {
  const descriptions: Record<string, string> = {
    formal: "Formal and official in tone, using proper government language",
    friendly: "Warm and approachable, using conversational language",
    empathetic: "Empathetic and understanding, acknowledging the constituent's concerns",
    technical: "Technical and detailed, explaining processes and procedures",
    professional: "Professional and courteous",
  };

  return descriptions[tone] || descriptions.professional;
}

/**
 * Build user prompt with case details
 */
function buildUserPrompt(context: {
  caseSubject: string;
  caseDescription: string;
  constituentName: string;
  constituentLanguage: string;
  conversationHistory: string;
  newsletterContext: string | null;
}): string {
  let prompt = `Please draft a response to the following constituent case:

**Subject:** ${context.caseSubject}

**Constituent:** ${context.constituentName}
**Preferred Language:** ${context.constituentLanguage}

**Case Description:**
${context.caseDescription}`;

  if (context.newsletterContext) {
    prompt += `\n\n**Additional Context:**\n${context.newsletterContext}`;
  }

  if (context.conversationHistory) {
    prompt += `\n\n**Conversation History:**\n${context.conversationHistory}`;
  }

  prompt += `\n\nPlease write a professional, helpful response that addresses the constituent's concerns.`;

  return prompt;
}

/**
 * Get a list of available tone options
 */
export function getAvailableTones(): string[] {
  return ["formal", "friendly", "empathetic", "technical"];
}

/**
 * Validate if a tone is available
 */
export function isValidTone(tone: string): boolean {
  return getAvailableTones().includes(tone);
}
