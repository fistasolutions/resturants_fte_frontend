import type { Metadata } from "next";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

import { ChatRouteView } from "@/features/chat/chat-route-view";
import { storeQueries } from "@/lib/queries/store";
import { getQueryClient } from "@/lib/query-client";
import { prefetch } from "@/lib/server-prefetch";
import { getSuggestedPrompts } from "@/services/chat";

export const metadata: Metadata = {
  title: "Chat with AI",
};

interface ChatRouteProps {
  /** `q` auto-asks a question (SPEC-046); `c` opens a conversation handed off
   * from the Ask Glisp panel (SPEC-235). */
  searchParams: Promise<{ q?: string; c?: string }>;
}

export default async function ChatRoute({ searchParams }: ChatRouteProps) {
  // The prompts are UI copy, not a fetch (services/chat.ts); the user's name streams
  // into the client cache (SPEC-230) instead of holding the page.
  const [params, prompts] = await Promise.all([searchParams, getSuggestedPrompts()]);
  const queryClient = getQueryClient();
  prefetch(queryClient, storeQueries.currentUser());
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ChatRouteView
        prompts={prompts}
        initialQuestion={params.q}
        initialConversationId={params.c}
      />
    </HydrationBoundary>
  );
}
