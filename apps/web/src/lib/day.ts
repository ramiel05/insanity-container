const formatterCache = new Map<string, Intl.DateTimeFormat>();

function formatDay(timestamp: number, timeZone: string): string {
  let formatter = formatterCache.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" });
    formatterCache.set(timeZone, formatter);
  }
  return formatter.format(new Date(timestamp));
}

export function isTickedToday(completedAt: number | null, now: number, timeZone: string): boolean {
  if (completedAt == null) return false;
  return formatDay(completedAt, timeZone) === formatDay(now, timeZone);
}

export function effectiveTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}
