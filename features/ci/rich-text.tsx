import { richText } from "@/lib/ci";

/** A report string with its <b>/<i>/<code> marks rendered as elements (SPEC-253). */
export function RichText({ text, className }: { text: string; className?: string }) {
  return (
    <span className={className}>
      {richText(text).map((t, i) => {
        if (t.kind === "b") return <strong key={i} className="font-semibold text-foreground">{t.text}</strong>;
        if (t.kind === "i") return <em key={i}>{t.text}</em>;
        if (t.kind === "code") {
          return (
            <code key={i} className="rounded border border-border bg-muted px-1 py-px font-mono text-[0.85em]">
              {t.text}
            </code>
          );
        }
        return <span key={i}>{t.text}</span>;
      })}
    </span>
  );
}
