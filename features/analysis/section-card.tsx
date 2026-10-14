import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

interface SectionCardProps {
  title: string;
  /** Small headline stat rendered right of the title (e.g. a count/total). */
  headline?: string;
  /** Data honesty label (SPEC-023/024): facts stay unlabeled; estimates and
   * projections state their basis so assumptions are never silent. */
  estimate?: string;
  children: React.ReactNode;
}

export function SectionCard({ title, headline, estimate, children }: SectionCardProps) {
  return (
    <Card className="gap-3 px-4 py-4">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-sm font-semibold">{title}</h2>
        {headline && (
          <span className="text-sm font-medium text-muted-foreground">{headline}</span>
        )}
        {estimate && (
          <Badge variant="outline" className="ml-auto font-normal text-muted-foreground">
            Estimate — {estimate}
          </Badge>
        )}
      </div>
      {children}
    </Card>
  );
}
