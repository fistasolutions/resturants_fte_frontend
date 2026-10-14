import { Info } from "lucide-react";

import { Card } from "@/components/ui/card";

/** "Good to know" — limits, cadence, prerequisites, deliberate non-features. */
export function DocNotes({ notes }: { notes: string[] }) {
  return (
    <Card className="gap-3 bg-muted/40 px-5 py-4">
      <ul className="space-y-2.5">
        {notes.map((note) => (
          <li key={note} className="flex gap-2.5 text-sm leading-relaxed text-foreground/90">
            <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
            <span>{note}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
