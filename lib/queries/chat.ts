/** Chat queries (SPEC-238): the models the picker may offer. Conversations still
 * load through `services/chat.ts` (their own external store, SPEC-019). */
import { defineQuery } from "@/lib/query-def";
import { toChatConversation, type ApiConversation } from "@/services/chat";
import type { ChatModels } from "@/types/ai-providers";
import type { ChatConversation, VoiceStatus } from "@/types/chat";

export const chatPaths = {
  models: (): string => "/chat/models",
  voiceStatus: (): string => "/chat/voice/status",
  /** SPEC-293: one employee's threads (backend SPEC-287) — never Glisp's. */
  employeeConversations: (employee: string): string =>
    `/chat/conversations?employee=${encodeURIComponent(employee)}`,
} as const;

export const chatQueries = {
  models: () => defineQuery<ChatModels>(["chat", "models"], (api) => api<ChatModels>(chatPaths.models())),
  /** SPEC-268: whether Talk to Glisp can run (an OpenAI key is in force). */
  voiceStatus: () =>
    defineQuery<VoiceStatus>(["chat", "voice-status"], (api) => api<VoiceStatus>(chatPaths.voiceStatus())),
  /** SPEC-293: an employee's threads with their messages, newest first. */
  employeeConversations: (employee: string) =>
    defineQuery<ChatConversation[]>(["chat", "employee", employee], async (api) => {
      const body = await api<{ items: ApiConversation[] }>(chatPaths.employeeConversations(employee));
      return body.items.map(toChatConversation);
    }),
} as const;
