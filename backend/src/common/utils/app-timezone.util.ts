const DAYS_OF_WEEK = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

type DateParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

/** Application timezone for schedule wall-clock times (not server UTC). */
export function getAppTimezone(): string {
  const fromEnv = process.env.APP_TIMEZONE?.trim();
  return fromEnv || 'Africa/Addis_Ababa';
}

function getDatePartsInZone(date: Date, timeZone: string): DateParts {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  const parts = formatter.formatToParts(date);
  const map: Record<string, string> = {};
  for (const part of parts) {
    if (part.type !== 'literal') {
      map[part.type] = part.value;
    }
  }
  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
    hour: Number(map.hour),
    minute: Number(map.minute),
    second: Number(map.second),
  };
}

/** Convert wall-clock HH:mm on a calendar day in `timeZone` to a UTC Date. */
export function wallClockToUtc(
  year: number,
  month: number,
  day: number,
  timeString: string,
  timeZone: string = getAppTimezone(),
): Date {
  const [hour, minute] = timeString.split(':').map(Number);
  const utcGuess = new Date(Date.UTC(year, month - 1, day, hour, minute, 0, 0));
  const parts = getDatePartsInZone(utcGuess, timeZone);
  const desiredMs = Date.UTC(year, month - 1, day, hour, minute, 0, 0);
  const actualMs = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  );
  return new Date(utcGuess.getTime() + (desiredMs - actualMs));
}

export function wallClockOnDateToUtc(
  date: Date,
  timeString: string,
  timeZone: string = getAppTimezone(),
): Date {
  const { year, month, day } = getDatePartsInZone(date, timeZone);
  return wallClockToUtc(year, month, day, timeString, timeZone);
}

export function startOfDayInZone(
  date: Date,
  timeZone: string = getAppTimezone(),
): Date {
  const { year, month, day } = getDatePartsInZone(date, timeZone);
  return wallClockToUtc(year, month, day, '00:00', timeZone);
}

export function endOfDayInZone(
  date: Date,
  timeZone: string = getAppTimezone(),
): Date {
  const { year, month, day } = getDatePartsInZone(date, timeZone);
  const nextMidnight = wallClockToUtc(year, month, day + 1, '00:00', timeZone);
  return new Date(nextMidnight.getTime() - 1);
}

export function getDayNameInZone(
  date: Date,
  timeZone: string = getAppTimezone(),
): string {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'long',
  });
  return formatter.format(date);
}

export function isSameCalendarDayInZone(
  a: Date,
  b: Date,
  timeZone: string = getAppTimezone(),
): boolean {
  const pa = getDatePartsInZone(a, timeZone);
  const pb = getDatePartsInZone(b, timeZone);
  return pa.year === pb.year && pa.month === pb.month && pa.day === pb.day;
}

export { DAYS_OF_WEEK };
