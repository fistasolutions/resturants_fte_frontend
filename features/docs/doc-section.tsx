import { cn } from "@/lib/utils";

interface DocSectionProps {
  id: string;
  title: string;
  /** One line under the heading, muted. */
  lead?: string;
  className?: string;
  children: React.ReactNode;
}

/** One titled block of a doc article, anchored for the "On this page" rail. */
export function DocSection({ id, title, lead, className, children }: DocSectionProps) {
  return (
    <section id={id} aria-labelledby={`${id}-heading`} className={cn("scroll-mt-24 space-y-4", className)}>
      <div>
        <h2 id={`${id}-heading`} className="font-heading text-xl tracking-wide">
          {title}
        </h2>
        {lead && <p className="mt-1 text-sm text-muted-foreground">{lead}</p>}
      </div>
      {children}
    </section>
  );
}
