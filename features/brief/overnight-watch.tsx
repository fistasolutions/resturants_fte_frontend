import { ExternalLink } from "lucide-react";

import { BriefDot, BriefPanel, BriefRow } from "@/features/brief/brief-panel";
import type { BriefWatchItem } from "@/types/brief";

interface OvernightWatchProps {
  items: BriefWatchItem[];
}

function WatchRow({ item }: { item: BriefWatchItem }) {
  return (
    <BriefRow
      href={item.href}
      leading={<BriefDot tone={item.status} />}
      trailing={
        item.href ? (
          <ExternalLink className="mt-0.5 size-3.5 text-muted-foreground" aria-hidden />
        ) : undefined
      }
    >
      <p className="text-sm font-semibold leading-snug">{item.title}</p>
      <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{item.detail}</p>
    </BriefRow>
  );
}

/** What happened while nobody was watching — one row per signal, in the rail (SPEC-231). */
export function OvernightWatch({ items }: OvernightWatchProps) {
  return (
    <BriefPanel title="Overnight Watch">
      {items.map((item) => (
        <WatchRow key={item.key} item={item} />
      ))}
    </BriefPanel>
  );
}
