export const DAYS_OF_WEEK = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

export type DayOfWeek = (typeof DAYS_OF_WEEK)[number];

const DAY_ALIASES: Record<string, DayOfWeek> = {
  sun: 'Sunday',
  sunday: 'Sunday',
  mon: 'Monday',
  monday: 'Monday',
  tue: 'Tuesday',
  tues: 'Tuesday',
  tuesday: 'Tuesday',
  wed: 'Wednesday',
  weds: 'Wednesday',
  wednesday: 'Wednesday',
  thu: 'Thursday',
  thur: 'Thursday',
  thurs: 'Thursday',
  thursday: 'Thursday',
  fri: 'Friday',
  friday: 'Friday',
  sat: 'Saturday',
  saturday: 'Saturday',
};

/** Normalize API/DB day values to canonical English day names. */
export function normalizeDayOfWeek(
  value: string | number | null | undefined,
): DayOfWeek | null {
  if (value == null || value === '') return null;

  if (typeof value === 'number' || /^\d+$/.test(String(value).trim())) {
    const idx = Number(value);
    return DAYS_OF_WEEK[idx] ?? null;
  }

  const trimmed = String(value).trim();
  const alias = DAY_ALIASES[trimmed.toLowerCase()];
  if (alias) return alias;

  const match = DAYS_OF_WEEK.find((d) => d.toLowerCase() === trimmed.toLowerCase());
  return match ?? null;
}

export function matchesDayOfWeek(
  scheduleDay: string | number | null | undefined,
  selectedDay: string,
): boolean {
  const normalizedSchedule = normalizeDayOfWeek(scheduleDay);
  const normalizedSelected = normalizeDayOfWeek(selectedDay);
  return (
    normalizedSchedule !== null &&
    normalizedSelected !== null &&
    normalizedSchedule === normalizedSelected
  );
}

export function getSchedulesForDay<T extends { dayOfWeek?: string | number | null }>(
  schedules: T[] | null | undefined,
  day: string,
): T[] {
  return (schedules ?? []).filter((s) => matchesDayOfWeek(s.dayOfWeek, day));
}

export function sortSchedulesByStartTime<T extends { startTimeString?: string | null }>(
  schedules: T[],
): T[] {
  return [...schedules].sort((a, b) =>
    (a.startTimeString ?? '').localeCompare(b.startTimeString ?? ''),
  );
}

export function getTodayDayName(): DayOfWeek {
  return DAYS_OF_WEEK[new Date().getDay()];
}

/** Monday-first display order for admin weekly grids. */
export const WEEK_DISPLAY_ORDER_MONDAY_FIRST: DayOfWeek[] = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];
