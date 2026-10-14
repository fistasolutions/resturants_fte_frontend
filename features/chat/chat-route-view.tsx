"use client";

import ChatLoading from "@/app/(app)/chat/loading";
import { ChatPage } from "@/features/chat/chat-page";
import { useApiQuery } from "@/hooks/use-api-query";
import { storeQueries } from "@/lib/queries/store";
import type { SuggestedPrompt } from "@/types/chat";

interface ChatRouteViewProps {
  prompts: SuggestedPrompt[];
  initialQuestion?: string;
  initialConversationId?: string;
}

/**
 * The chat route, read from the client cache (SPEC-230). The only server data the
 * page needs is the user's name for the greeting; conversations already load
 * client-side inside `ChatPage`. On a revisit the name is cached, so the chat is on
 * screen instantly.
 */
export function ChatRouteView({
  prompts,
  initialQuestion,
  initialConversationId,
}: ChatRouteViewProps) {
  const user = useApiQuery(storeQueries.currentUser());
  if (user.isPending) return <ChatLoading />;
  // A failed name lookup must not take the chat down — greet without it.
  const userName = user.isSuccess ? user.data.name : "";
  return (
    <ChatPage
      userName={userName}
      prompts={prompts}
      initialQuestion={initialQuestion}
      initialConversationId={initialConversationId}
    />
  );
}
