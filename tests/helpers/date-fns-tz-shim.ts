/**
 * Minimal, behavior-faithful shim for the two `date-fns-tz` helpers used by
 * `@/lib/sla`. The installed `date-fns-tz@2` is incompatible with
 * `date-fns@3` under the test runner's ESM resolver (it imports internal
 * `date-fns` paths removed in v3), which makes the real package impossible to
 * load in tests. This shim implements `utcToZonedTime` / `zonedTimeToUtc`
 * using the platform `Intl` API so SLA logic is exercised with correct
 * timezone math — no behavior change to the application source.
 */

function getTimezoneOffsetMs(date: Date, timeZone: string): number {
  // Format the instant in the target timezone, then read it back as if it
  // were UTC to recover the offset between the zone's wall clock and UTC.
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const parts = dtf.formatToParts(date);
  const map: Record<string, number> = {};
  for (const p of parts) {
    if (p.type !== 'literal') map[p.type] = parseInt(p.value, 10);
  }
  // `hour` can come back as 24 for midnight in some environments.
  const hour = map.hour === 24 ? 0 : map.hour;
  const asUTC = Date.UTC(
    map.year,
    map.month - 1,
    map.day,
    hour,
    map.minute,
    map.second
  );
  return asUTC - date.getTime();
}

/**
 * Returns a Date whose UTC fields hold the wall-clock time of `date` in
 * `timeZone` (matching date-fns-tz v2 semantics).
 */
export function utcToZonedTime(date: Date | number, timeZone: string): Date {
  const d = typeof date === 'number' ? new Date(date) : new Date(date.getTime());
  const offset = getTimezoneOffsetMs(d, timeZone);
  return new Date(d.getTime() + offset);
}

/**
 * Inverse of utcToZonedTime: interprets the wall-clock fields of `date` as
 * local time in `timeZone` and returns the corresponding UTC instant.
 */
export function zonedTimeToUtc(date: Date | number, timeZone: string): Date {
  const d = typeof date === 'number' ? new Date(date) : new Date(date.getTime());
  // First approximation of the offset, then refine once to handle DST edges.
  const offset = getTimezoneOffsetMs(d, timeZone);
  const utcGuess = new Date(d.getTime() - offset);
  const offset2 = getTimezoneOffsetMs(utcGuess, timeZone);
  return new Date(d.getTime() - offset2);
}
