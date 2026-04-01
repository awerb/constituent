import {
  addHours,
  addMinutes,
  differenceInMinutes,
  differenceInHours,
  isBefore,
  isAfter,
  startOfDay,
  endOfDay,
  addDays,
  isWeekend,
  parse,
} from "date-fns";
import { utcToZonedTime, zonedTimeToUtc } from "date-fns-tz";

export interface SLAConfig {
  businessHoursStart: string; // "HH:mm" format
  businessHoursEnd: string; // "HH:mm" format
  businessDays: string[]; // ["MON", "TUE", "WED", "THU", "FRI"]
  timezone: string; // "America/New_York"
}

/**
 * Calculate SLA deadline based on business hours
 * Handles weekends and business hour boundaries
 */
export function calculateSlaDeadline(
  startTime: Date,
  hours: number,
  config: SLAConfig
): Date {
  const timezone = config.timezone;
  const businessDays = new Set(config.businessDays);

  // Convert start time to timezone
  let currentTime = utcToZonedTime(startTime, timezone);
  let remainingHours = hours;

  // Parse business hours
  const [startHour, startMin] = config.businessHoursStart.split(":").map(Number);
  const [endHour, endMin] = config.businessHoursEnd.split(":").map(Number);

  // If we're outside business hours, start from next business day
  const dayOfWeek = getDayOfWeekString(currentTime);
  if (
    !isWithinBusinessHours(currentTime, config) ||
    !businessDays.has(dayOfWeek)
  ) {
    currentTime = getNextBusinessDayStart(currentTime, config);
  }

  while (remainingHours > 0) {
    const dayOfWeek = getDayOfWeekString(currentTime);

    // Skip non-business days
    if (!businessDays.has(dayOfWeek)) {
      currentTime = addDays(currentTime, 1);
      currentTime = new Date(
        currentTime.getFullYear(),
        currentTime.getMonth(),
        currentTime.getDate(),
        startHour,
        startMin,
        0
      );
      continue;
    }

    // Get remaining time in current business day
    const businessDayStart = new Date(
      currentTime.getFullYear(),
      currentTime.getMonth(),
      currentTime.getDate(),
      startHour,
      startMin,
      0
    );
    const businessDayEnd = new Date(
      currentTime.getFullYear(),
      currentTime.getMonth(),
      currentTime.getDate(),
      endHour,
      endMin,
      0
    );

    // If current time is before business hours, jump to start
    if (isBefore(currentTime, businessDayStart)) {
      currentTime = businessDayStart;
    }

    // If current time is after business hours, jump to next day
    if (isAfter(currentTime, businessDayEnd)) {
      currentTime = addDays(currentTime, 1);
      currentTime = new Date(
        currentTime.getFullYear(),
        currentTime.getMonth(),
        currentTime.getDate(),
        startHour,
        startMin,
        0
      );
      continue;
    }

    // Calculate hours available today
    const hoursAvailableToday =
      (businessDayEnd.getTime() - currentTime.getTime()) / (1000 * 60 * 60);

    if (hoursAvailableToday >= remainingHours) {
      // Deadline is today
      currentTime = addHours(currentTime, remainingHours);
      remainingHours = 0;
    } else {
      // Use rest of today and continue to next day
      remainingHours -= hoursAvailableToday;
      currentTime = addDays(currentTime, 1);
      currentTime = new Date(
        currentTime.getFullYear(),
        currentTime.getMonth(),
        currentTime.getDate(),
        startHour,
        startMin,
        0
      );
    }
  }

  // Convert back to UTC
  return zonedTimeToUtc(currentTime, timezone);
}

/**
 * Check if a time is within business hours
 */
export function isWithinBusinessHours(time: Date, config: SLAConfig): boolean {
  const timezone = config.timezone;
  const businessDays = new Set(config.businessDays);

  const zonedTime = utcToZonedTime(time, timezone);
  const dayOfWeek = getDayOfWeekString(zonedTime);

  // Check if it's a business day
  if (!businessDays.has(dayOfWeek)) {
    return false;
  }

  // Parse business hours
  const [startHour, startMin] = config.businessHoursStart.split(":").map(Number);
  const [endHour, endMin] = config.businessHoursEnd.split(":").map(Number);

  const businessDayStart = new Date(
    zonedTime.getFullYear(),
    zonedTime.getMonth(),
    zonedTime.getDate(),
    startHour,
    startMin,
    0
  );
  const businessDayEnd = new Date(
    zonedTime.getFullYear(),
    zonedTime.getMonth(),
    zonedTime.getDate(),
    endHour,
    endMin,
    0
  );

  return (
    isAfter(zonedTime, businessDayStart) &&
    isBefore(zonedTime, businessDayEnd)
  );
}

/**
 * Get time remaining in business hours until deadline
 */
export function getTimeRemainingInBusinessHours(
  deadline: Date,
  config: SLAConfig
): { hours: number; minutes: number; isBreached: boolean } {
  const timezone = config.timezone;
  const businessDays = new Set(config.businessDays);

  const now = new Date();
  const isBreached = isBefore(deadline, now);

  if (isBreached) {
    return { hours: 0, minutes: 0, isBreached: true };
  }

  const zonedNow = utcToZonedTime(now, timezone);
  const zonedDeadline = utcToZonedTime(deadline, timezone);

  const [startHour, startMin] = config.businessHoursStart.split(":").map(Number);
  const [endHour, endMin] = config.businessHoursEnd.split(":").map(Number);

  let totalBusinessMinutes = 0;
  let currentTime = zonedNow;

  while (isBefore(currentTime, zonedDeadline)) {
    const dayOfWeek = getDayOfWeekString(currentTime);

    // Skip non-business days
    if (!businessDays.has(dayOfWeek)) {
      currentTime = addDays(startOfDay(currentTime), 1);
      currentTime = new Date(
        currentTime.getFullYear(),
        currentTime.getMonth(),
        currentTime.getDate(),
        startHour,
        startMin,
        0
      );
      continue;
    }

    const businessDayStart = new Date(
      currentTime.getFullYear(),
      currentTime.getMonth(),
      currentTime.getDate(),
      startHour,
      startMin,
      0
    );
    const businessDayEnd = new Date(
      currentTime.getFullYear(),
      currentTime.getMonth(),
      currentTime.getDate(),
      endHour,
      endMin,
      0
    );

    // If current time is before business hours, jump to start
    if (isBefore(currentTime, businessDayStart)) {
      currentTime = businessDayStart;
    }

    // If current time is after business hours, jump to next day
    if (isAfter(currentTime, businessDayEnd)) {
      currentTime = addDays(currentTime, 1);
      currentTime = new Date(
        currentTime.getFullYear(),
        currentTime.getMonth(),
        currentTime.getDate(),
        startHour,
        startMin,
        0
      );
      continue;
    }

    // Calculate minutes available today
    const endTime = isBefore(zonedDeadline, businessDayEnd)
      ? zonedDeadline
      : businessDayEnd;

    const minutesAvailableToday = differenceInMinutes(endTime, currentTime);
    totalBusinessMinutes += minutesAvailableToday;

    if (isAfter(zonedDeadline, businessDayEnd)) {
      currentTime = addDays(currentTime, 1);
      currentTime = new Date(
        currentTime.getFullYear(),
        currentTime.getMonth(),
        currentTime.getDate(),
        startHour,
        startMin,
        0
      );
    } else {
      break;
    }
  }

  const hours = Math.floor(totalBusinessMinutes / 60);
  const minutes = totalBusinessMinutes % 60;

  return { hours, minutes, isBreached: false };
}

/**
 * Helper: Get next business day start time
 */
function getNextBusinessDayStart(time: Date, config: SLAConfig): Date {
  const businessDays = new Set(config.businessDays);
  const [startHour, startMin] = config.businessHoursStart.split(":").map(Number);

  let nextDay = addDays(startOfDay(time), 1);

  while (true) {
    const dayOfWeek = getDayOfWeekString(nextDay);
    if (businessDays.has(dayOfWeek)) {
      return new Date(
        nextDay.getFullYear(),
        nextDay.getMonth(),
        nextDay.getDate(),
        startHour,
        startMin,
        0
      );
    }
    nextDay = addDays(nextDay, 1);
  }
}

/**
 * Helper: Get day of week as string ("MON", "TUE", etc.)
 */
function getDayOfWeekString(date: Date): string {
  const days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  return days[date.getDay()];
}
