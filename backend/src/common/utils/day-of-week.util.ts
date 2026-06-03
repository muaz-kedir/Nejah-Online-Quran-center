const DAYS_OF_WEEK = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

const DAY_ALIASES: Record<string, string> = {
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

export function normalizeDayOfWeek(
  value: string | number | null | undefined,
): string | null {
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
