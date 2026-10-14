import { CheckCircle2 } from "lucide-react";

/** "Benefits" — outcomes, one check each. Success tone is the semantic token. */
export function DocChecklist({ items }: { items: string[] }) {
  return (
    <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {items.map((item) => (
        <li key={item} className="flex gap-2.5 text-sm leading-relaxed text-foreground/90">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
