interface SimpleTableProps {
  headers: string[];
  /** Row cells, first column left-aligned, the rest right-aligned. */
  rows: React.ReactNode[][];
  emptyMessage: string;
}

/** Compact token-styled table for analysis sections — server-rendered, no
 * client JS (SPEC-023/024). Wide content scrolls inside the card. */
export function SimpleTable({ headers, rows, emptyMessage }: SimpleTableProps) {
  if (rows.length === 0) {
    return <p className="py-4 text-sm text-muted-foreground">{emptyMessage}</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs text-muted-foreground">
            {headers.map((header, index) => (
              <th
                key={header}
                className={`py-2 font-medium ${index > 0 ? "pl-4 text-right" : "pr-4"}`}
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((cells, rowIndex) => (
            <tr
              key={rowIndex}
              className="border-b border-border/50 last:border-0"
            >
              {cells.map((cell, cellIndex) => (
                <td
                  key={cellIndex}
                  className={`py-2 ${
                    cellIndex > 0
                      ? "pl-4 text-right tabular-nums whitespace-nowrap"
                      : "max-w-64 truncate pr-4 font-medium"
                  }`}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
