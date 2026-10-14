import { Badge } from "@/components/ui/badge";

export type StatusTone =
  | "success"
  | "warning"
  | "destructive"
  | "info"
  | "ai"
  | "neutral";

const toneClasses: Record<StatusTone, string> = {
  success: "bg-success/15 text-success",
  warning: "bg-warning/15 text-warning",
  destructive: "bg-destructive/15 text-destructive",
  info: "bg-info/15 text-info",
  ai: "bg-ai/15 text-ai",
  neutral: "bg-secondary text-muted-foreground",
};

interface StatusBadgeProps {
  tone: StatusTone;
  children: React.ReactNode;
}

/** Token-toned status badge — the one way statuses are rendered in tables. */
export function StatusBadge({ tone, children }: StatusBadgeProps) {
  return <Badge className={toneClasses[tone]}>{children}</Badge>;
}
