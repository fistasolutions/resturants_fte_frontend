"use client";

interface TableEmptyRowProps {
  /** Number of columns, so the message spans the table. */
  span: number;
  noun: string;
  onClear: () => void;
}

/** The one row a filtered table shows when nothing matches (SPEC-258) — inside the
 * table, so the header stays where it was. */
export function TableEmptyRow({ span, noun, onClear }: TableEmptyRowProps) {
  return (
    <tr>
      <td colSpan={span} className="px-3 py-8 text-center">
        <p className="text-sm font-medium text-foreground">No {noun} match</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Try another word, or{" "}
          <button
            type="button"
            onClick={onClear}
            className="font-medium text-foreground underline underline-offset-2 outline-none hover:text-primary focus-visible:ring-2 focus-visible:ring-ring"
          >
            clear the filters
          </button>
          .
        </p>
      </td>
    </tr>
  );
}
