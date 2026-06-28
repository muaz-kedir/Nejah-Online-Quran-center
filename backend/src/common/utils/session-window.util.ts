/** Minutes after scheduled end a teacher may still start a missed session. */
export function getLateStartGraceMs(): number {
  const minutes = Number(process.env.SESSION_LATE_START_GRACE_MINUTES);
  return (Number.isFinite(minutes) && minutes > 0 ? minutes : 180) * 60 * 1000;
}

export function normalizeScheduledEnd(
  scheduledStart: Date,
  scheduledEnd: Date | null | undefined,
): Date {
  if (!scheduledEnd || scheduledEnd.getTime() <= scheduledStart.getTime()) {
    return new Date(scheduledStart.getTime() + 60 * 60 * 1000);
  }
  return scheduledEnd;
}

export function isWithinLateStartWindow(
  scheduledStart: Date | null | undefined,
  scheduledEnd: Date | null | undefined,
  now: Date,
  graceMs = getLateStartGraceMs(),
): boolean {
  if (!scheduledStart) return true;
  const end = normalizeScheduledEnd(scheduledStart, scheduledEnd);
  return now.getTime() <= end.getTime() + graceMs;
}
