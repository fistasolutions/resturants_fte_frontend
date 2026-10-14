import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Titled card wrapper for Spotlight knowledge sections (SPEC-109). Keeps the
 * Brand Brain sections consistent — a heading row (with an optional trailing
 * action / provenance chip) over the section body.
 */
export function SectionCard({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card className="gap-4">
      <CardHeader className="grid-cols-[1fr_auto] items-center gap-2">
        <CardTitle>{title}</CardTitle>
        {action}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
