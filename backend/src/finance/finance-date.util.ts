export function fmtDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function currentBillingMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function startOfMonthDate(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function endOfMonthDate(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

export function startOfWeekDate(d: Date): Date {
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const result = new Date(d);
  result.setDate(d.getDate() + diff);
  result.setHours(0, 0, 0, 0);
  return result;
}

export function endOfWeekDate(d: Date): Date {
  const start = startOfWeekDate(d);
  const result = new Date(start);
  result.setDate(start.getDate() + 6);
  result.setHours(23, 59, 59, 999);
  return result;
}

export function startOfYearDate(d: Date): Date {
  return new Date(d.getFullYear(), 0, 1);
}

export function endOfYearDate(d: Date): Date {
  return new Date(d.getFullYear(), 11, 31);
}

export function addDaysDate(d: Date, days: number): Date {
  const result = new Date(d);
  result.setDate(result.getDate() + days);
  return result;
}

export function parseDateStr(str: string): Date {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function isBeforeDate(a: string, b: Date): boolean {
  return parseDateStr(a) < b;
}
