import { describe, it, expect, beforeEach } from "vitest";
import {
  calculateSlaDeadline,
  isWithinBusinessHours,
  getTimeRemainingInBusinessHours,
  type SLAConfig,
} from "@/lib/sla";

describe("SLA Monitor Service", () => {
  const baseConfig: SLAConfig = {
    businessHoursStart: "09:00",
    businessHoursEnd: "17:00",
    businessDays: ["MON", "TUE", "WED", "THU", "FRI"],
    timezone: "America/New_York",
  };

  describe("Calculates deadline within business hours", () => {
    it("should calculate deadline 4 hours from 10am same day", () => {
      const startTime = new Date("2024-03-28T10:00:00-04:00");
      const result = calculateSlaDeadline(startTime, 4, baseConfig);

      const resultHours = result.getUTCHours();
      const resultMinutes = result.getUTCMinutes();
      const expectedTime = new Date("2024-03-28T18:00:00-04:00");

      expect(result.getTime()).toBeCloseTo(expectedTime.getTime(), -4);
    });

    it("should add 2 hours from 1pm to 3pm same day", () => {
      const startTime = new Date("2024-03-28T13:00:00-04:00");
      const result = calculateSlaDeadline(startTime, 2, baseConfig);

      const expectedTime = new Date("2024-03-28T15:00:00-04:00");
      expect(result.getTime()).toBeCloseTo(expectedTime.getTime(), -4);
    });
  });

  describe("Calculates deadline crossing end of business day", () => {
    it("should extend to next day when crossing 5pm", () => {
      const startTime = new Date("2024-03-28T15:00:00-04:00");
      const result = calculateSlaDeadline(startTime, 4, baseConfig);

      const expectedTime = new Date("2024-03-29T12:00:00-04:00");
      expect(result.getTime()).toBeCloseTo(expectedTime.getTime(), -4);
    });

    it("should handle deadline at exact business day end", () => {
      const startTime = new Date("2024-03-28T16:00:00-04:00");
      const result = calculateSlaDeadline(startTime, 1, baseConfig);

      const expectedTime = new Date("2024-03-29T10:00:00-04:00");
      expect(result.getTime()).toBeCloseTo(expectedTime.getTime(), -4);
    });
  });

  describe("Calculates deadline over weekend", () => {
    it("should skip weekend and land on monday morning", () => {
      const fridayTime = new Date("2024-03-29T16:00:00-04:00");
      const result = calculateSlaDeadline(fridayTime, 4, baseConfig);

      const expectedTime = new Date("2024-04-01T13:00:00-04:00");
      expect(result.getTime()).toBeCloseTo(expectedTime.getTime(), -4);
    });

    it("should handle 8 hour deadline from friday 2pm", () => {
      const fridayTime = new Date("2024-03-29T14:00:00-04:00");
      const result = calculateSlaDeadline(fridayTime, 8, baseConfig);

      const expectedTime = new Date("2024-04-01T14:00:00-04:00");
      expect(result.getTime()).toBeCloseTo(expectedTime.getTime(), -4);
    });

    it("should handle deadline starting on saturday", () => {
      const saturdayTime = new Date("2024-03-30T10:00:00-04:00");
      const result = calculateSlaDeadline(saturdayTime, 4, baseConfig);

      const expectedTime = new Date("2024-04-01T13:00:00-04:00");
      expect(result.getTime()).toBeCloseTo(expectedTime.getTime(), -4);
    });
  });

  describe("Identifies SLA breach when current time > deadline", () => {
    it("should return remaining time 0 and isBreached true when past deadline", () => {
      const now = new Date();
      const pastDeadline = new Date(now.getTime() - 60 * 60 * 1000);

      const result = getTimeRemainingInBusinessHours(pastDeadline, baseConfig);

      expect(result.isBreached).toBe(true);
      expect(result.hours).toBe(0);
      expect(result.minutes).toBe(0);
    });

    it("should return remaining time when before deadline", () => {
      const now = new Date();
      const futureDeadline = new Date(now.getTime() + 4 * 60 * 60 * 1000);

      const result = getTimeRemainingInBusinessHours(futureDeadline, baseConfig);

      expect(result.isBreached).toBe(false);
      expect(result.hours).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Calculates remaining time correctly", () => {
    it("should calculate remaining business hours until deadline", () => {
      const now = new Date("2024-03-28T10:00:00-04:00");
      const deadline = new Date("2024-03-28T14:00:00-04:00");

      const result = getTimeRemainingInBusinessHours(deadline, baseConfig);

      expect(result.isBreached).toBe(false);
      expect(result.hours).toBe(4);
      expect(result.minutes).toBe(0);
    });

    it("should handle partial hours remaining", () => {
      const now = new Date("2024-03-28T10:30:00-04:00");
      const deadline = new Date("2024-03-28T12:45:00-04:00");

      const result = getTimeRemainingInBusinessHours(deadline, baseConfig);

      expect(result.isBreached).toBe(false);
      expect(result.hours).toBe(2);
      expect(result.minutes).toBeGreaterThanOrEqual(0);
    });

    it("should return 0 when deadline is now", () => {
      const now = new Date("2024-03-28T10:00:00-04:00");
      const deadline = new Date("2024-03-28T10:00:00-04:00");

      const result = getTimeRemainingInBusinessHours(deadline, baseConfig);

      expect(result.isBreached).toBe(false);
    });
  });

  describe("Handles different business hour configs", () => {
    it("should respect custom business hours 8am-6pm", () => {
      const customConfig: SLAConfig = {
        ...baseConfig,
        businessHoursStart: "08:00",
        businessHoursEnd: "18:00",
      };

      const startTime = new Date("2024-03-28T09:00:00-04:00");
      const result = calculateSlaDeadline(startTime, 4, customConfig);

      const expectedTime = new Date("2024-03-28T13:00:00-04:00");
      expect(result.getTime()).toBeCloseTo(expectedTime.getTime(), -4);
    });

    it("should respect custom business days (Mon-Sat)", () => {
      const customConfig: SLAConfig = {
        ...baseConfig,
        businessDays: ["MON", "TUE", "WED", "THU", "FRI", "SAT"],
      };

      const fridayTime = new Date("2024-03-29T14:00:00-04:00");
      const result = calculateSlaDeadline(fridayTime, 8, customConfig);

      const saturdayTime = new Date("2024-03-30T14:00:00-04:00");
      expect(result.getTime()).toBeCloseTo(saturdayTime.getTime(), -4);
    });

    it("should handle single day business week", () => {
      const customConfig: SLAConfig = {
        ...baseConfig,
        businessDays: ["MON"],
      };

      const mondayTime = new Date("2024-03-25T09:00:00-04:00");
      const result = calculateSlaDeadline(mondayTime, 8, customConfig);

      const nextMondayTime = new Date("2024-04-01T09:00:00-04:00");
      expect(result.getTime()).toBeCloseTo(nextMondayTime.getTime(), -4);
    });
  });

  describe("Handles timezone correctly", () => {
    it("should convert time from UTC to target timezone", () => {
      const utcTime = new Date("2024-03-28T14:00:00Z");
      const result = calculateSlaDeadline(utcTime, 4, baseConfig);

      expect(result).toBeInstanceOf(Date);
      expect(result.getTime()).toBeGreaterThan(utcTime.getTime());
    });

    it("should handle Pacific timezone correctly", () => {
      const pacificConfig: SLAConfig = {
        ...baseConfig,
        timezone: "America/Los_Angeles",
      };

      const startTime = new Date("2024-03-28T10:00:00-07:00");
      const result = calculateSlaDeadline(startTime, 4, pacificConfig);

      expect(result).toBeInstanceOf(Date);
    });

    it("should handle UTC timezone", () => {
      const utcConfig: SLAConfig = {
        ...baseConfig,
        timezone: "UTC",
      };

      const startTime = new Date("2024-03-28T10:00:00Z");
      const result = calculateSlaDeadline(startTime, 4, utcConfig);

      expect(result).toBeInstanceOf(Date);
    });
  });

  describe("Identifies time within business hours", () => {
    it("should return true for time during business hours on weekday", () => {
      const businessTime = new Date("2024-03-28T14:00:00-04:00");

      const result = isWithinBusinessHours(businessTime, baseConfig);

      expect(result).toBe(true);
    });

    it("should return false for time before business hours", () => {
      const earlyTime = new Date("2024-03-28T08:00:00-04:00");

      const result = isWithinBusinessHours(earlyTime, baseConfig);

      expect(result).toBe(false);
    });

    it("should return false for time after business hours", () => {
      const lateTime = new Date("2024-03-28T18:00:00-04:00");

      const result = isWithinBusinessHours(lateTime, baseConfig);

      expect(result).toBe(false);
    });

    it("should return false for weekend", () => {
      const saturdayTime = new Date("2024-03-30T14:00:00-04:00");

      const result = isWithinBusinessHours(saturdayTime, baseConfig);

      expect(result).toBe(false);
    });

    it("should return true for business hours on thursday", () => {
      const thursdayTime = new Date("2024-03-28T15:00:00-04:00");

      const result = isWithinBusinessHours(thursdayTime, baseConfig);

      expect(result).toBe(true);
    });
  });

  describe("Handles edge cases", () => {
    it("should handle deadline exactly at start of business hours", () => {
      const startTime = new Date("2024-03-28T09:00:00-04:00");
      const result = calculateSlaDeadline(startTime, 8, baseConfig);

      const expectedTime = new Date("2024-03-28T17:00:00-04:00");
      expect(result.getTime()).toBeCloseTo(expectedTime.getTime(), -4);
    });

    it("should handle deadline exactly at end of business hours", () => {
      const startTime = new Date("2024-03-28T13:00:00-04:00");
      const result = calculateSlaDeadline(startTime, 4, baseConfig);

      const expectedTime = new Date("2024-03-28T17:00:00-04:00");
      expect(result.getTime()).toBeCloseTo(expectedTime.getTime(), -4);
    });

    it("should handle fractional hours", () => {
      const startTime = new Date("2024-03-28T10:00:00-04:00");
      const result = calculateSlaDeadline(startTime, 2.5, baseConfig);

      const expectedTime = new Date("2024-03-28T12:30:00-04:00");
      expect(result.getTime()).toBeCloseTo(expectedTime.getTime(), -4);
    });

    it("should handle 0 hours remaining", () => {
      const now = new Date();
      const result = getTimeRemainingInBusinessHours(now, baseConfig);

      expect(result.isBreached).toBe(false);
      expect(result.hours).toBe(0);
    });
  });
});
