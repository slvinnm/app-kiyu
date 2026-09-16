export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "http://localhost:8000/api/v1/kiosk";

export const SUCCESS_RESET_DELAY = 10;

export function createIdempotencyKey(): string {
  return crypto.randomUUID();
}

export function formatTime(date: Date): string {
  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date);
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export async function getErrorMessage(
  response: Response,
  fallback: string,
): Promise<string> {
  try {
    const payload = await response.json();

    return (
      payload?.message ??
      payload?.errors?.message?.[0] ??
      fallback
    );
  } catch {
    return fallback;
  }
}