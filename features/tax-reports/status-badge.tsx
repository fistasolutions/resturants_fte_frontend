import { statusTone } from "@/lib/tax-report";

/** The client wrote the words RECONCILED / REVIEW REQUIRED himself, and they
 *  carry the meaning — so they are rendered as text rather than as a colour
 *  alone, surviving greyscale, screenshots and colour blindness. */
export function StatusBadge({ reconciled }: { reconciled: boolean }) {
  return (
    <span
      className={`inline-flex shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold tracking-wide ${statusTone(reconciled)}`}
    >
      {reconciled ? "RECONCILED" : "REVIEW REQUIRED"}
    </span>
  );
}
