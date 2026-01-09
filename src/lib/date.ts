/**
 * Format date to YYYY-MM-DD in local timezone
 * This prevents UTC conversion issues when grouping data by date
 */
export function formatDateLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Format date to medium format with time
 * Format: "Oct 8, 2025, 12:34 PM"
 */
export function clientFormatDateTimeMedium(
  date: Date | string | number,
  locale = "en-US",
): string {
  return new Date(date).toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Format date to readable format
 * Format: "October 8, 2025"
 */
export function clientFormatDateLong(
  date: Date | string | number,
  locale = "en-US",
): string {
  return new Date(date).toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
