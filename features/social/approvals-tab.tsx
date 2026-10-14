"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";

import { Card } from "@/components/ui/card";
import { pendingPostToCardItem } from "@/lib/social-post";
import type { ApprovalsData, PendingPost } from "@/types/social";
import { formatDate } from "@/utils/format";

import { PostCard } from "./post-card";
import { PostDetail } from "./post-detail";

/** One clickable Approvals card, mapped from a `PendingPost` view-model. */
function ApprovalCard({
  post,
  onOpen,
}: {
  post: PendingPost;
  onOpen: () => void;
}) {
  return (
    <PostCard
      post={pendingPostToCardItem(post, formatDate(post.submittedAt))}
      onClick={onOpen}
    />
  );
}

export function ApprovalsTab({ data }: { data: ApprovalsData }) {
  const router = useRouter();
  const [openId, setOpenId] = useState<string | null>(null);

  if (!data.featured) {
    return (
      <Card className="gap-3 px-6 py-12 text-center">
        <CheckCircle2 className="mx-auto size-8 text-success" aria-hidden />
        <p className="text-sm font-medium">Nothing awaiting approval.</p>
        <p className="mx-auto max-w-md text-sm text-muted-foreground">
          Generate a post in Content Studio and it&apos;ll show up here for your review.
        </p>
      </Card>
    );
  }

  // Detail view: open the selected post; approving / requesting changes returns to
  // the list and re-pulls the (server-rendered) approvals data.
  if (openId) {
    // Full content width so `PostDetail`'s own two-column layout (preview +
    // details/hashtags) has room instead of being squeezed into the featured
    // column (SPEC-142 fix 1).
    return (
      <div className="w-full">
        <PostDetail
          key={openId}
          postId={openId}
          onBack={() => setOpenId(null)}
          onChanged={() => {
            setOpenId(null);
            router.refresh();
          }}
        />
      </div>
    );
  }

  const { featured, queue } = data;

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">Up next for review</h2>
        <ApprovalCard post={featured} onOpen={() => setOpenId(featured.id)} />
      </section>

      {queue.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-foreground">
            {queue.length} more {queue.length === 1 ? "post" : "posts"} awaiting review
          </h2>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {queue.map((post) => (
              <ApprovalCard key={post.id} post={post} onOpen={() => setOpenId(post.id)} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
