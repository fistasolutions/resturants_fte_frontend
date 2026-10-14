/** A numbered list of steps — used for "How it works" (the mechanism) and
 * "How to use it" (the tutorial). Numbers are rendered, not counted by CSS, so
 * they read the same in every browser and in print. */
export function DocSteps({ steps }: { steps: string[] }) {
  return (
    <ol className="space-y-3">
      {steps.map((step, index) => (
        <li key={index} className="flex gap-3">
          <span
            aria-hidden
            className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold tabular-nums text-secondary-foreground"
          >
            {index + 1}
          </span>
          <p className="text-sm leading-relaxed text-foreground/90">{step}</p>
        </li>
      ))}
    </ol>
  );
}
