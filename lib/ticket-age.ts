/**
 * How long a ticket has been waiting (SPEC-096) — a compact, human age from its
 * creation time to "now", e.g. "3d 4h", "5h 12m", "8m". `now` is passed in so
 * the function is pure and unit-testable. Returns null for missing/invalid
 * input or a future timestamp.
 */
export function ticketAge(
  createdISO: string | null | undefined,
  nowISO: string,
): string | null {
  if (!createdISO) return null;
  const created = Date.parse(createdISO);
  const now = Date.parse(nowISO);
  if (Number.isNaN(created) || Number.isNaN(now)) return null;
  const totalMinutes = Math.floor((now - created) / 60000);
  if (totalMinutes < 0) return null;

  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}
