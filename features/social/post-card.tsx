"use client";

import type { PostCardItem } from "@/lib/social-post";

import { EditorialThumb } from "./editorial-thumb";
import { ChannelBadge, PostStatusChip } from "./social-pills";

/**
 * A compact, clickable post card (SPEC-138) — the whole card is one button so it
 * is click- and keyboard-operable. Shows the editorial image when the post has
 * one (`postImageUrl`), else the product photo, plus the product name, its
 * channel, and a status chip. `onClick` opens the `PostDetail`.
 */
export function PostCard({
  post,
  onClick,
}: {
  post: PostCardItem;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Open ${post.productName}`}
      className="flex w-full items-center gap-3 rounded-card border border-border bg-card p-3 text-left transition-colors outline-none hover:border-primary/50 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <EditorialThumb
        name={post.productName}
        postId={post.hasImage ? post.postId : null}
        imageUrl={post.imageUrl}
        className="size-14 shrink-0 object-cover"
      />
      <div className="min-w-0 flex-1 space-y-1.5">
        <p className="truncate text-sm font-medium text-foreground">
          {post.productName}
        </p>
        {post.subtitle && (
          <p className="truncate text-xs text-muted-foreground">{post.subtitle}</p>
        )}
        <div className="flex flex-wrap items-center gap-1.5">
          <ChannelBadge channel={post.channel} />
          <PostStatusChip status={post.status} />
        </div>
      </div>
    </button>
  );
}
