"use client";

import { useState } from "react";
import { Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FormError } from "@/features/restaurant/parts";
import { TAG_LABELS, tagsFor, toggleTag } from "@/lib/reputation";
import { cn } from "@/lib/utils";
import { ratePublicOrder } from "@/services/storefront-actions";
import type { RatingTag, TrackRating } from "@/types/restaurant-os";

/** The tracker's ask (SPEC-390): stars, a few taps on what stood out, a comment — once. */
export function RateOrder({ token, canRate, rating }: { token: string; canRate: boolean; rating: TrackRating | null }) {
  const [stars, setStars] = useState(0);
  const [tags, setTags] = useState<RatingTag[]>([]);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<TrackRating | null>(rating);

  if (saved) {
    return (
      <section className="space-y-1 rounded-2xl border border-border bg-card p-4 text-sm">
        <p className="font-semibold text-foreground">Thank you for rating your order.</p>
        <p className="text-muted-foreground">
          {saved.stars} of 5 stars{saved.tags.length ? ` · ${saved.tags.map((t) => TAG_LABELS[t]).join(", ")}` : ""}
        </p>
      </section>
    );
  }
  if (!canRate) return null;
  const offered = stars ? tagsFor(stars) : [];

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      setSaved(await ratePublicOrder(token, { stars, tags, comment: comment.trim() || null }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "The rating could not be saved.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="space-y-3 rounded-2xl border border-border bg-card p-4">
      <p className="font-semibold text-foreground">How was your order?</p>
      <div className="flex gap-1" role="radiogroup" aria-label="Your rating">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={stars === n}
            aria-label={`${n} star${n === 1 ? "" : "s"}`}
            onClick={() => {
              setStars(n);
              setTags((current) => current.filter((t) => tagsFor(n).includes(t)));
            }}
            className="rounded-md p-1 outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Star className={cn("size-7", n <= stars ? "fill-foreground text-foreground" : "text-muted-foreground")} aria-hidden />
          </button>
        ))}
      </div>
      {offered.length ? (
        <div className="flex flex-wrap gap-1.5" role="group" aria-label={stars >= 4 ? "What was great" : "What went wrong"}>
          {offered.map((tag) => (
            <button
              key={tag}
              type="button"
              aria-pressed={tags.includes(tag)}
              onClick={() => setTags((current) => toggleTag(current, tag, offered))}
              className={cn(
                "rounded-full border px-3 py-1 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring",
                tags.includes(tag) ? "border-foreground/40 bg-muted font-semibold" : "border-border text-muted-foreground",
              )}
            >
              {TAG_LABELS[tag]}
            </button>
          ))}
        </div>
      ) : null}
      {stars ? (
        <Textarea
          aria-label="Anything else?"
          placeholder="Anything else? (optional)"
          value={comment}
          maxLength={1000}
          onChange={(e) => setComment(e.target.value)}
          rows={2}
        />
      ) : null}
      <FormError message={error} />
      <Button type="button" disabled={!stars || busy} onClick={() => void submit()}>
        {busy ? "Sending…" : "Send rating"}
      </Button>
    </section>
  );
}
