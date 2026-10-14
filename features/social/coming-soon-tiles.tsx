import { Clapperboard, Images, Pin, Radio, Video } from "lucide-react";

import { Card } from "@/components/ui/card";
import { GlispIcon } from "@/components/shared/glisp-icon";

/**
 * The deliberately-deferred surface (SPEC-172), on the wall rather than absent.
 *
 * Each tile carries one honest line of WHY it isn't built, so the roadmap reads
 * as a set of decisions rather than a list of gaps. Inert by design — nothing
 * here is clickable, because implying a half-built feature is worse than
 * showing none.
 */
const TILES = [
  {
    icon: Images,
    title: "Carousels",
    detail:
      "The highest-save format on Instagram. Needs a coherent multi-frame set, not one image — the closest big win.",
  },
  {
    icon: Video,
    title: "Reels & video",
    detail:
      "Roughly 2.25× the reach of a static post, and where most discovery happens. The biggest remaining prize.",
  },
  {
    icon: Clapperboard,
    title: "Stories",
    detail:
      "Cheap to add once publishing exists, but they vanish in 24 hours and don't compound.",
  },
  {
    icon: Radio,
    title: "TikTok",
    detail:
      "A separate platform with its own API and approval. Worth adding once the Meta loop is proven.",
  },
  {
    icon: Pin,
    title: "Pinterest",
    detail: "Long-lived for fashion, but smaller reach than Instagram.",
  },
  {
    icon: GlispIcon,
    title: "AI learns from performance",
    detail:
      "Doubling down on what actually works for your audience. Genuinely blocked on months of the performance data now being collected.",
  },
] as const;

export function ComingSoonTiles() {
  return (
    <section aria-label="Coming soon" className="space-y-3">
      <div>
        <p className="text-[10px] font-medium tracking-widest text-muted-foreground uppercase">
          Roadmap
        </p>
        <h2 className="text-sm font-semibold">Coming soon</h2>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {TILES.map(({ icon: Icon, title, detail }) => (
          <Card key={title} className="gap-2 px-4 py-4 opacity-70">
            <div className="flex items-start justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                <p className="truncate text-sm font-semibold">{title}</p>
              </div>
              <span className="inline-flex shrink-0 items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                Coming soon
              </span>
            </div>
            <p className="text-sm text-muted-foreground">{detail}</p>
          </Card>
        ))}
      </div>
    </section>
  );
}
