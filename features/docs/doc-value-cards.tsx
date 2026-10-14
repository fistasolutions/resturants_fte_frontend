import { Card } from "@/components/ui/card";
import type { DocValue } from "@/types/docs";

/** "Why it matters" — the problem and what the feature changes, one card each. */
export function DocValueCards({ values }: { values: DocValue[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {values.map((value) => (
        <Card key={value.title} className="gap-2 px-5 py-4">
          <p className="text-sm font-semibold">{value.title}</p>
          <p className="text-sm leading-relaxed text-muted-foreground">{value.body}</p>
        </Card>
      ))}
    </div>
  );
}
