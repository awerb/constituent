import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  draftResponse,
  AIDraftError,
  getAvailableTones,
  isValidTone,
} from "@/server/services/ai-drafter";
import { prisma } from "@/lib/db";
import * as aiModule from "@/lib/ai";

vi.mock("@/lib/db");
vi.mock("@/lib/ai");

describe("AI Drafter Service", () => {
  const mockAIClient = {
    draft: vi.fn(),
    detectLanguage: vi.fn(),
    isAvailable: vi.fn(),
  };

  const mockCity = {
    id: "city-1",
    name: "San Francisco",
    features: { aiDrafting: true },
  };

  const mockDepartment = {
    id: "dept-1",
    name: "Parks & Recreation",
  };

  const mockConstituent = {
    id: "const-1",
    name: "John Smith",
    email: "john@example.com",
    languagePreference: "es",
  };

  const mockCase = {
    id: "case-1",
    subject: "Park Maintenance Issue",
    description: "The playground equipment needs repair",
    referenceNumber: "REF-001",
    constituent: mockConstituent,
    department: mockDepartment,
    messages: [
      {
        id: "msg-1",
        authorType: "CONSTITUENT",
        content: "Help needed!",
        createdAt: new Date("2024-01-01"),
      },
      {
        id: "msg-2",
        authorType: "STAFF",
        content: "We're looking into this",
        createdAt: new Date("2024-01-02"),
      },
    ],
    newsletterItem: {
      id: "nl-1",
      title: "Park Improvements Initiative",
    },
  };

  const mockTemplate = {
    id: "tmpl-1",
    content: "Use friendly and helpful tone in responses",
    status: "APPROVED",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(aiModule.getAIClient).mockReturnValue(mockAIClient);
  });

  describe("draftResponse - Basic Functionality", () => {
    it("should gather correct context from case, constituent, and department", async () => {
      mockAIClient.isAvailable.mockResolvedValue(true);
      mockAIClient.draft.mockResolvedValue("We will address this promptly");
      mockAIClient.detectLanguage.mockResolvedValue("en");

      vi.mocked(prisma.case).findUniqueOrThrow.mockResolvedValue(mockCase);
      vi.mocked(prisma.city).findUniqueOrThrow.mockResolvedValue(mockCity);
      vi.mocked(prisma.template).findFirst.mockResolvedValue(mockTemplate);

      const result = await draftResponse({
        cityId: "city-1",
        caseId: "case-1",
        tone: "friendly",
      });

      expect(result.draft).toBe("We will address this promptly");
      expect(result.language).toBe("en");

      // Verify case was loaded with correct includes
      expect(prisma.case.findUniqueOrThrow).toHaveBeenCalledWith({
        where: { id: "case-1" },
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

      expect(prisma.city.findUniqueOrThrow).toHaveBeenCalledWith({
        where: { id: "city-1" },
      });
    });

    it("should build correct system prompt with city name, department, and tone", async () => {
      mockAIClient.isAvailable.mockResolvedValue(true);
      mockAIClient.draft.mockResolvedValue("Drafted response");
      mockAIClient.detectLanguage.mockResolvedValue("en");

      vi.mocked(prisma.case).findUniqueOrThrow.mockResolvedValue(mockCase);
      vi.mocked(prisma.city).findUniqueOrThrow.mockResolvedValue(mockCity);
      vi.mocked(prisma.template).findFirst.mockResolvedValue(null);

      await draftResponse({
        cityId: "city-1",
        caseId: "case-1",
        tone: "formal",
      });

      const draftCall = mockAIClient.draft.mock.calls[0];
      const systemPrompt = draftCall[1]?.systemPrompt as string;

      expect(systemPrompt).toContain("San Francisco");
      expect(systemPrompt).toContain("Parks & Recreation");
      expect(systemPrompt).toContain("Formal and official in tone");
    });

    it("should use constituent's language preference when building prompt", async () => {
      mockAIClient.isAvailable.mockResolvedValue(true);
      mockAIClient.draft.mockResolvedValue("Respuesta");
      mockAIClient.detectLanguage.mockResolvedValue("es");

      vi.mocked(prisma.case).findUniqueOrThrow.mockResolvedValue(mockCase);
      vi.mocked(prisma.city).findUniqueOrThrow.mockResolvedValue(mockCity);
      vi.mocked(prisma.template).findFirst.mockResolvedValue(null);

      await draftResponse({
        cityId: "city-1",
        caseId: "case-1",
      });

      const draftCall = mockAIClient.draft.mock.calls[0];
      const userPrompt = draftCall[0];

      expect(userPrompt).toContain("es");
      expect(userPrompt).toContain("Preferred Language");
    });

    it("should detect language of drafted response", async () => {
      mockAIClient.isAvailable.mockResolvedValue(true);
      mockAIClient.draft.mockResolvedValue("Respuesta en español");
      mockAIClient.detectLanguage.mockResolvedValue("es");

      vi.mocked(prisma.case).findUniqueOrThrow.mockResolvedValue(mockCase);
      vi.mocked(prisma.city).findUniqueOrThrow.mockResolvedValue(mockCity);
      vi.mocked(prisma.template).findFirst.mockResolvedValue(null);

      const result = await draftResponse({
        cityId: "city-1",
        caseId: "case-1",
      });

      expect(result.language).toBe("es");
      expect(mockAIClient.detectLanguage).toHaveBeenCalledWith(
        "Respuesta en español"
      );
    });
  });

  describe("draftResponse - Tone Options", () => {
    beforeEach(() => {
      mockAIClient.isAvailable.mockResolvedValue(true);
      mockAIClient.draft.mockResolvedValue("Response");
      mockAIClient.detectLanguage.mockResolvedValue("en");
      vi.mocked(prisma.case).findUniqueOrThrow.mockResolvedValue(mockCase);
      vi.mocked(prisma.city).findUniqueOrThrow.mockResolvedValue(mockCity);
      vi.mocked(prisma.template).findFirst.mockResolvedValue(null);
    });

    it("should handle formal tone", async () => {
      await draftResponse({
        cityId: "city-1",
        caseId: "case-1",
        tone: "formal",
      });

      const systemPrompt = mockAIClient.draft.mock.calls[0][1]?.systemPrompt;
      expect(systemPrompt).toContain("Formal and official");
    });

    it("should handle friendly tone", async () => {
      await draftResponse({
        cityId: "city-1",
        caseId: "case-1",
        tone: "friendly",
      });

      const systemPrompt = mockAIClient.draft.mock.calls[0][1]?.systemPrompt;
      expect(systemPrompt).toContain("Warm and approachable");
    });

    it("should handle empathetic tone", async () => {
      await draftResponse({
        cityId: "city-1",
        caseId: "case-1",
        tone: "empathetic",
      });

      const systemPrompt = mockAIClient.draft.mock.calls[0][1]?.systemPrompt;
      expect(systemPrompt).toContain("Empathetic and understanding");
    });

    it("should handle technical tone", async () => {
      await draftResponse({
        cityId: "city-1",
        caseId: "case-1",
        tone: "technical",
      });

      const systemPrompt = mockAIClient.draft.mock.calls[0][1]?.systemPrompt;
      expect(systemPrompt).toContain("Technical and detailed");
    });

    it("should use professional tone by default", async () => {
      await draftResponse({
        cityId: "city-1",
        caseId: "case-1",
      });

      const systemPrompt = mockAIClient.draft.mock.calls[0][1]?.systemPrompt;
      expect(systemPrompt).toContain("Professional and courteous");
    });
  });

  describe("draftResponse - Template Handling", () => {
    beforeEach(() => {
      mockAIClient.isAvailable.mockResolvedValue(true);
      mockAIClient.draft.mockResolvedValue("Templated response");
      mockAIClient.detectLanguage.mockResolvedValue("en");
      vi.mocked(prisma.case).findUniqueOrThrow.mockResolvedValue(mockCase);
      vi.mocked(prisma.city).findUniqueOrThrow.mockResolvedValue(mockCity);
    });

    it("should include template guidance in system prompt when available", async () => {
      vi.mocked(prisma.template).findFirst.mockResolvedValue(mockTemplate);

      await draftResponse({
        cityId: "city-1",
        caseId: "case-1",
      });

      const systemPrompt = mockAIClient.draft.mock.calls[0][1]?.systemPrompt;
      expect(systemPrompt).toContain("Use this template as a reference");
      expect(systemPrompt).toContain("Use friendly and helpful tone in responses");
    });

    it("should fetch approved template for department", async () => {
      vi.mocked(prisma.template).findFirst.mockResolvedValue(mockTemplate);

      await draftResponse({
        cityId: "city-1",
        caseId: "case-1",
      });

      expect(prisma.template.findFirst).toHaveBeenCalledWith({
        where: {
          cityId: "city-1",
          departmentId: "dept-1",
          status: "APPROVED",
        },
        orderBy: { createdAt: "desc" },
      });
    });

    it("should handle case with no matching template", async () => {
      vi.mocked(prisma.template).findFirst.mockResolvedValue(null);

      const result = await draftResponse({
        cityId: "city-1",
        caseId: "case-1",
      });

      expect(result.draft).toBe("Templated response");
      const systemPrompt = mockAIClient.draft.mock.calls[0][1]?.systemPrompt;
      expect(systemPrompt).not.toContain("Use this template as a reference");
    });
  });

  describe("draftResponse - Newsletter Context", () => {
    beforeEach(() => {
      mockAIClient.isAvailable.mockResolvedValue(true);
      mockAIClient.draft.mockResolvedValue("Newsletter response");
      mockAIClient.detectLanguage.mockResolvedValue("en");
      vi.mocked(prisma.city).findUniqueOrThrow.mockResolvedValue(mockCity);
      vi.mocked(prisma.template).findFirst.mockResolvedValue(null);
    });

    it("should include newsletter context when available", async () => {
      vi.mocked(prisma.case).findUniqueOrThrow.mockResolvedValue(mockCase);

      await draftResponse({
        cityId: "city-1",
        caseId: "case-1",
      });

      const userPrompt = mockAIClient.draft.mock.calls[0][0];
      expect(userPrompt).toContain("newsletter item");
      expect(userPrompt).toContain("Park Improvements Initiative");
    });

    it("should handle case with no newsletter item", async () => {
      const caseNoNewsletter = { ...mockCase, newsletterItem: null };
      vi.mocked(prisma.case).findUniqueOrThrow.mockResolvedValue(
        caseNoNewsletter
      );

      await draftResponse({
        cityId: "city-1",
        caseId: "case-1",
      });

      const userPrompt = mockAIClient.draft.mock.calls[0][0];
      expect(userPrompt).not.toContain("newsletter item");
    });
  });

  describe("draftResponse - Message Handling", () => {
    beforeEach(() => {
      mockAIClient.isAvailable.mockResolvedValue(true);
      mockAIClient.draft.mockResolvedValue("Response");
      mockAIClient.detectLanguage.mockResolvedValue("en");
      vi.mocked(prisma.city).findUniqueOrThrow.mockResolvedValue(mockCity);
      vi.mocked(prisma.template).findFirst.mockResolvedValue(null);
    });

    it("should include conversation history from messages", async () => {
      vi.mocked(prisma.case).findUniqueOrThrow.mockResolvedValue(mockCase);

      await draftResponse({
        cityId: "city-1",
        caseId: "case-1",
      });

      const userPrompt = mockAIClient.draft.mock.calls[0][0];
      expect(userPrompt).toContain("Conversation History");
      expect(userPrompt).toContain("CONSTITUENT");
      expect(userPrompt).toContain("STAFF");
      expect(userPrompt).toContain("Help needed!");
      expect(userPrompt).toContain("We're looking into this");
    });

    it("should limit context to 10 most recent messages", async () => {
      vi.mocked(prisma.case).findUniqueOrThrow.mockResolvedValue(mockCase);

      await draftResponse({
        cityId: "city-1",
        caseId: "case-1",
      });

      // Verify the take parameter was used
      expect(prisma.case.findUniqueOrThrow).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            messages: expect.objectContaining({
              take: 10,
            }),
          }),
        })
      );
    });

    it("should handle case with no messages gracefully", async () => {
      const caseNoMessages = { ...mockCase, messages: [] };
      vi.mocked(prisma.case).findUniqueOrThrow.mockResolvedValue(
        caseNoMessages
      );

      await draftResponse({
        cityId: "city-1",
        caseId: "case-1",
      });

      const userPrompt = mockAIClient.draft.mock.calls[0][0];
      expect(userPrompt).toBeDefined();
    });
  });

  describe("draftResponse - Error Handling", () => {
    beforeEach(() => {
      vi.mocked(prisma.case).findUniqueOrThrow.mockResolvedValue(mockCase);
      vi.mocked(prisma.city).findUniqueOrThrow.mockResolvedValue(mockCity);
      vi.mocked(prisma.template).findFirst.mockResolvedValue(null);
    });

    it("should throw AIDraftError when AI is unavailable", async () => {
      mockAIClient.isAvailable.mockResolvedValue(false);

      await expect(
        draftResponse({
          cityId: "city-1",
          caseId: "case-1",
        })
      ).rejects.toThrow(AIDraftError);

      const error = await draftResponse({
        cityId: "city-1",
        caseId: "case-1",
      }).catch((e) => e);

      expect(error.code).toBe("AI_UNAVAILABLE");
    });

    it("should handle AI client timeout gracefully", async () => {
      mockAIClient.isAvailable.mockResolvedValue(true);
      mockAIClient.draft.mockRejectedValue(new Error("Timeout"));
      mockAIClient.detectLanguage.mockResolvedValue("en");

      await expect(
        draftResponse({
          cityId: "city-1",
          caseId: "case-1",
        })
      ).rejects.toThrow(AIDraftError);
    });

    it("should handle AI client errors (API key invalid, rate limited)", async () => {
      mockAIClient.isAvailable.mockResolvedValue(true);
      mockAIClient.draft.mockRejectedValue(
        new Error("Invalid API key or rate limited")
      );

      await expect(
        draftResponse({
          cityId: "city-1",
          caseId: "case-1",
        })
      ).rejects.toThrow(AIDraftError);
    });

    it("should throw AIDraftError with DRAFT_FAILED code on unexpected errors", async () => {
      mockAIClient.isAvailable.mockResolvedValue(true);
      mockAIClient.draft.mockResolvedValue("Response");
      mockAIClient.detectLanguage.mockResolvedValue("en");

      vi.mocked(prisma.case).findUniqueOrThrow.mockRejectedValue(
        new Error("Database error")
      );

      const error = await draftResponse({
        cityId: "city-1",
        caseId: "case-1",
      }).catch((e) => e);

      expect(error).toBeInstanceOf(AIDraftError);
      expect(error.code).toBe("DRAFT_FAILED");
    });

    it("should throw error when AI generates empty response", async () => {
      mockAIClient.isAvailable.mockResolvedValue(true);
      mockAIClient.draft.mockResolvedValue("");

      await expect(
        draftResponse({
          cityId: "city-1",
          caseId: "case-1",
        })
      ).rejects.toThrow(AIDraftError);
    });

    it("should throw error when AI generates null response", async () => {
      mockAIClient.isAvailable.mockResolvedValue(true);
      mockAIClient.draft.mockResolvedValue(null);

      await expect(
        draftResponse({
          cityId: "city-1",
          caseId: "case-1",
        })
      ).rejects.toThrow(AIDraftError);
    });
  });

  describe("draftResponse - Context Building", () => {
    beforeEach(() => {
      mockAIClient.isAvailable.mockResolvedValue(true);
      mockAIClient.draft.mockResolvedValue("Response");
      mockAIClient.detectLanguage.mockResolvedValue("en");
      vi.mocked(prisma.city).findUniqueOrThrow.mockResolvedValue(mockCity);
      vi.miced(prisma.template).findFirst.mockResolvedValue(null);
      vi.mocked(prisma.case).findUniqueOrThrow.mockResolvedValue(mockCase);
    });

    it("should include case subject and description in prompt", async () => {
      await draftResponse({
        cityId: "city-1",
        caseId: "case-1",
      });

      const userPrompt = mockAIClient.draft.mock.calls[0][0];
      expect(userPrompt).toContain("Park Maintenance Issue");
      expect(userPrompt).toContain(
        "The playground equipment needs repair"
      );
    });

    it("should include constituent name or email in prompt", async () => {
      await draftResponse({
        cityId: "city-1",
        caseId: "case-1",
      });

      const userPrompt = mockAIClient.draft.mock.calls[0][0];
      expect(userPrompt).toContain("John Smith");
    });

    it("should use email when constituent name is not available", async () => {
      const caseNoName = {
        ...mockCase,
        constituent: { ...mockConstituent, name: null },
      };
      vi.mocked(prisma.case).findUniqueOrThrow.mockResolvedValue(caseNoName);

      await draftResponse({
        cityId: "city-1",
        caseId: "case-1",
      });

      const userPrompt = mockAIClient.draft.mock.calls[0][0];
      expect(userPrompt).toContain("john@example.com");
    });
  });

  describe("Tone Utilities", () => {
    it("getAvailableTones should return all valid tones", () => {
      const tones = getAvailableTones();
      expect(tones).toContain("formal");
      expect(tones).toContain("friendly");
      expect(tones).toContain("empathetic");
      expect(tones).toContain("technical");
      expect(tones.length).toBe(4);
    });

    it("isValidTone should validate tone correctly", () => {
      expect(isValidTone("formal")).toBe(true);
      expect(isValidTone("friendly")).toBe(true);
      expect(isValidTone("empathetic")).toBe(true);
      expect(isValidTone("technical")).toBe(true);
      expect(isValidTone("invalid")).toBe(false);
      expect(isValidTone("FORMAL")).toBe(false);
    });
  });
});
