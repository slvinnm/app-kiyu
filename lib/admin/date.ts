/**
 * Backend date filters use `whereDate`, so the frontend must send the tenant's
 * local date rather than a UTC date.
 */
export function todayJakarta(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date())
}
