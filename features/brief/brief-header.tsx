import type { BriefYesterday } from "@/types/brief";

interface BriefHeaderProps {
  /** Time-of-day greeting, computed by the page so server and client agree — the
   * same string the route's skeleton paints first. */
  greeting: string;
  yesterday: BriefYesterday;
}

function formatBriefDate(isoDate: string): string {
  const date = new Date(isoDate + "T00:00:00");
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

/** Greeting and the brief's date. Yesterday's revenue and orders, which used to sit on
 * a line under this, live in the KPI strip since SPEC-231. */
export function BriefHeader({ greeting, yesterday }: BriefHeaderProps) {
  return (
    <h1 className="font-heading text-2xl tracking-wide">
      {greeting} 👋 &mdash;{" "}
      <span className="font-normal text-muted-foreground">{formatBriefDate(yesterday.date)}</span>
    </h1>
  );
}
