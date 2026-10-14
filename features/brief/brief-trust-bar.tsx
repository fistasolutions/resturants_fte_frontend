import { Lock, RefreshCw, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";

const TRUST_ITEMS = [
  {
    icon: Lock,
    text: "Read-only Shopify connection — we can never modify your store",
  },
  {
    icon: RefreshCw,
    text: "Data refreshes every 15 minutes via scheduled sync",
  },
  {
    icon: ShieldCheck,
    text: "Decisions are logged and auditable — nothing acts without your approval",
  },
];

interface BriefTrustBarProps {
  /** Right-aligned footnote — the "Data as of" stamp. */
  children?: ReactNode;
}

/** The page's footer line (SPEC-231): the three trust statements, and the data stamp
 * on the right — one line instead of a box, so it reads as a footnote. */
export function BriefTrustBar({ children }: BriefTrustBarProps) {
  return (
    <div className="flex flex-col gap-2 px-1 text-[11px] text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:flex-wrap sm:gap-x-4">
        {TRUST_ITEMS.map(({ icon: Icon, text }) => (
          <p key={text} className="flex min-w-0 items-center gap-1.5 leading-snug">
            <Icon className="size-3 shrink-0" aria-hidden />
            {text}
          </p>
        ))}
      </div>
      {children ? <p className="shrink-0 text-muted-foreground/70">{children}</p> : null}
    </div>
  );
}
