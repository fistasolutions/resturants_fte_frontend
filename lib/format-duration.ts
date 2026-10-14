/** Formats a duration in seconds for the Team Performance table (SPEC-081)
 * — "1h 20m" / "18m" style, matching this repo's existing `HoursChip`
 * duration-formatting convention. `null` (no data yet) renders as "—". */
export function formatDuration(seconds: number | null): string {
  if (seconds === null) return "—";
  if (seconds < 60) return "<1m";
  const totalMinutes = Math.round(seconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}m`;
  return minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`;
}
