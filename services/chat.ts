/**
 * AI chat service — live streamed agent endpoint + server-backed history
 * (SPEC-017, SPEC-019). Client-side: goes through the /api/proxy route, which
 * injects the httpOnly JWT. The backend persists every turn (backend SPEC-010).
 */
import type { ChatModelPreference } from "@/types/ai-providers";
import type { VoiceStatus } from "@/types/chat";
import type {
  ChatConversation,
  ChatProject,
  ChatProjectStyle,
  ChatMessage,
  ChatModelOverride,
  ChatPageContext,
  ChatSources,
  SuggestedPrompt,
} from "@/types/chat";

/** Curated starters (UI copy, not data). */
export async function getSuggestedPrompts(): Promise<SuggestedPrompt[]> {
  return [
    { id: "revenue", label: "How is revenue this week?" },
    { id: "products", label: "What are my best-selling products?" },
    { id: "customers", label: "New vs returning customers this month?" },
    { id: "inventory", label: "Anything low on stock?" },
  ];
}

function apiBase(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? "/api/proxy";
}

// ── server history (backend SPEC-010) ────────────────────────────────────────

interface ApiMessage {
  id: number;
  role: "user" | "assistant";
  content: string;
  created_at: string;
  model?: string | null;
  temperature?: number | null;
  sources?: ChatSources | null;
  feedback?: number | null;
  pinned_at?: string | null;
}

export interface ApiConversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  messages: ApiMessage[];
  project_id?: string | null;
  pinned_at?: string | null;
}

export interface ApiProject {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  conversation_count: number;
  color?: string;
  icon?: string;
}

export function toChatProject(api: ApiProject): ChatProject {
  return {
    id: api.id,
    name: api.name,
    createdAt: api.created_at,
    updatedAt: api.updated_at,
    conversationCount: api.conversation_count,
    color: api.color ?? "slate",
    icon: api.icon ?? "folder",
  };
}

/** API → UI view model (message ids stringified for React keys). */
export function toChatConversation(api: ApiConversation): ChatConversation {
  return {
    id: api.id,
    title: api.title,
    createdAt: api.created_at,
    updatedAt: api.updated_at,
    messages: api.messages.map(
      (message): ChatMessage => ({
        id: String(message.id),
        role: message.role,
        content: message.content,
        createdAt: message.created_at,
        model: message.model ?? null,
        temperature: message.temperature ?? null,
        sources: message.sources ?? null,
        feedback: message.feedback ?? null,
        pinnedAt: message.pinned_at ?? null,
      }),
    ),
    projectId: api.project_id ?? null,
    pinnedAt: api.pinned_at ?? null,
  };
}

/** UI → import payload (exact ids/titles/timestamps; backend SPEC-010 caps). */
export function toImportPayload(conversations: ChatConversation[]): {
  conversations: Array<{
    id: string;
    title: string;
    created_at: string;
    updated_at: string;
    messages: Array<{ role: string; content: string; created_at: string }>;
  }>;
} {
  // Only what the server accepts (SPEC-019 Patches): a stored thread can carry an
  // empty or over-long message, an empty title or a non-UUID id, and one bad entry
  // used to fail the whole import on every page load.
  const importable = conversations
    .filter((conversation) => UUID_RE.test(conversation.id) && conversation.title.trim().length > 0)
    .map((conversation) => ({
      id: conversation.id,
      title: conversation.title.trim().slice(0, 80),
      created_at: conversation.createdAt,
      updated_at: conversation.updatedAt,
      messages: conversation.messages
        .filter((message) => message.content.length > 0 && message.content.length <= IMPORT_MESSAGE_MAX)
        .slice(0, 200)
        .map((message) => ({
          role: message.role,
          content: message.content,
          created_at: message.createdAt,
        })),
    }))
    .filter((conversation) => conversation.messages.length > 0);
  return { conversations: importable.slice(0, 100) };
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** The backend's `ImportMessage.content` ceiling. */
const IMPORT_MESSAGE_MAX = 8000;

/** The account's chat history plus the thread it was last in (SPEC-245). */
export interface ChatHistory {
  conversations: ChatConversation[];
  /** `null` when no thread is open or the remembered one is gone. */
  activeId: string | null;
  /** SPEC-249: the owner's projects, newest-updated first. */
  projects: ChatProject[];
}

/** All conversations with messages — one call, newest-updated first — and the
 * account's last active thread (backend SPEC-252). */
export async function listConversations(): Promise<ChatHistory> {
  const response = await fetch(`${apiBase()}/chat/conversations`);
  if (!response.ok) {
    throw new Error(`Loading chat history failed (${response.status}).`);
  }
  const body = (await response.json()) as {
    items: ApiConversation[];
    active_id?: string | null;
    projects?: ApiProject[];
  };
  return {
    conversations: body.items.map(toChatConversation),
    activeId: typeof body.active_id === "string" ? body.active_id : null,
    projects: (body.projects ?? []).map(toChatProject),
  };
}

/** The server's message for a failed write, else a status-only fallback. */
async function failureMessage(response: Response, fallback: string): Promise<string> {
  const body = (await response.json().catch(() => null)) as
    | { error?: { message?: string } }
    | null;
  return body?.error?.message ?? `${fallback} (${response.status}).`;
}

/** SPEC-249: create a project (SPEC-255: with its colour and icon). Throws with
 * the server's message (a duplicate name). */
export async function createProject(
  name: string,
  style?: Partial<ChatProjectStyle>,
): Promise<ChatProject> {
  const response = await fetch(`${apiBase()}/chat/projects`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, ...(style?.color ? { color: style.color } : {}), ...(style?.icon ? { icon: style.icon } : {}) }),
  });
  if (!response.ok) throw new Error(await failureMessage(response, "Creating the project failed"));
  return toChatProject((await response.json()) as ApiProject);
}

/** Rename and/or restyle; a key left out is left alone. */
export async function updateProject(
  projectId: string,
  patch: { name?: string } & Partial<ChatProjectStyle>,
): Promise<ChatProject> {
  const response = await fetch(`${apiBase()}/chat/projects/${encodeURIComponent(projectId)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!response.ok) throw new Error(await failureMessage(response, "Updating the project failed"));
  return toChatProject((await response.json()) as ApiProject);
}

/** SPEC-266: remember the owner's chat model on the account. Throws with the
 * server's reason (a model whose provider has no key, a temperature over the ceiling). */
export async function setChatModel(preference: ChatModelPreference): Promise<ChatModelPreference | null> {
  const response = await fetch(`${apiBase()}/chat/model`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(preference),
  });
  if (!response.ok) throw new Error(await failureMessage(response, "Saving the model failed"));
  return ((await response.json()) as { preferred: ChatModelPreference | null }).preferred;
}

/** Idempotent — 404 means it is already gone. Its chats survive, unfiled. */
export async function deleteProject(projectId: string): Promise<void> {
  const response = await fetch(`${apiBase()}/chat/projects/${encodeURIComponent(projectId)}`, {
    method: "DELETE",
  });
  if (!response.ok && response.status !== 404) {
    throw new Error(await failureMessage(response, "Deleting the project failed"));
  }
}

/** File / unfile (`projectId: null`) and pin / unpin a conversation; a key left
 * out is left alone. */
export async function updateConversation(
  conversationId: string,
  patch: { projectId?: string | null; pinned?: boolean },
): Promise<void> {
  const body: Record<string, unknown> = {};
  if ("projectId" in patch) body.project_id = patch.projectId ?? null;
  if (patch.pinned !== undefined) body.pinned = patch.pinned;
  const response = await fetch(
    `${apiBase()}/chat/conversations/${encodeURIComponent(conversationId)}`,
    { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) },
  );
  if (!response.ok) throw new Error(await failureMessage(response, "Updating the chat failed"));
}

/** Pin / unpin an assistant message. */
export async function pinMessage(messageId: string, pinned: boolean): Promise<void> {
  const response = await fetch(
    `${apiBase()}/chat/messages/${encodeURIComponent(messageId)}/pin`,
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pinned }) },
  );
  if (!response.ok) throw new Error(await failureMessage(response, "Pinning the answer failed"));
}

/** Remember the thread the owner is in, on the account (SPEC-245); `null` for
 * "no thread open". */
export async function setActiveConversation(conversationId: string | null): Promise<void> {
  const response = await fetch(`${apiBase()}/chat/active`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ conversation_id: conversationId }),
  });
  if (!response.ok) {
    throw new Error(`Remembering the conversation failed (${response.status}).`);
  }
}

/** One-time localStorage migration; idempotent server-side. */
export async function importConversations(
  conversations: ChatConversation[],
): Promise<void> {
  if (conversations.length === 0) return;
  const response = await fetch(`${apiBase()}/chat/conversations/import`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(toImportPayload(conversations)),
  });
  if (!response.ok) {
    throw new ChatImportError(response.status);
  }
}

/** Carries the status so the caller can tell "will never succeed" (4xx) from "try again". */
export class ChatImportError extends Error {
  constructor(public readonly status: number) {
    super(`Importing chat history failed (${status}).`);
    this.name = "ChatImportError";
  }
}

/** 👍 (1), 👎 (-1) or clear (0) on an assistant message (SPEC-240). */
export async function rateMessage(messageId: string, value: 1 | -1 | 0): Promise<void> {
  const response = await fetch(
    `${apiBase()}/chat/messages/${encodeURIComponent(messageId)}/feedback`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value }),
    },
  );
  if (!response.ok) {
    throw new Error(`Saving your rating failed (${response.status}).`);
  }
}

/** Idempotent delete — 404 means it is already gone. */
export async function deleteConversation(conversationId: string): Promise<void> {
  const response = await fetch(
    `${apiBase()}/chat/conversations/${encodeURIComponent(conversationId)}`,
    { method: "DELETE" },
  );
  if (!response.ok && response.status !== 404) {
    throw new Error(`Deleting the conversation failed (${response.status}).`);
  }
}

// ── streaming reply ──────────────────────────────────────────────────────────

interface SseFrame {
  conversation_id?: string;
  /** SPEC-363: the id the server stored this question under — what an edit names. */
  user_message_id?: number | null;
  /** Which model will answer (SPEC-238) — sent before the first token. */
  model?: string;
  temperature?: number | null;
  overridden?: boolean;
  delta?: string;
  /** Fresh follow-up chips after each reply (backend SPEC-021). */
  suggestions?: string[];
  /** Live progress phrase while the agent works (backend SPEC-030). */
  status?: string;
  error?: string;
  detail?: string;
  done?: boolean;
  /** On the `done` frame (SPEC-240): the stored reply's id and its provenance. */
  message_id?: number | null;
  sources?: ChatSources | null;
}

/** What a streamed turn resolves to (SPEC-240). */
export interface AssistantTurn {
  reply: string;
  /** The server's id for the stored reply; null when it could not be persisted. */
  messageId: string | null;
  sources: ChatSources | null;
}

/**
 * Streams the agent reply into `conversationId` — the server persists the
 * user message and the reply (SPEC-019). `onDelta` (SPEC-016) fires with the
 * ACCUMULATED text after every frame so callers can render progressively;
 * the promise still resolves the full reply.
 */
export async function getAssistantReply(
  prompt: string,
  conversationId: string,
  onDelta?: (accumulated: string) => void,
  onSuggestions?: (questions: string[]) => void,
  onStatus?: (status: string) => void,
  /** Where the question was asked from (SPEC-236) — the drawer sends it, the
   * chat page does not. Omitted from the body when absent, so the request is
   * byte-identical to before for callers that have none. */
  context?: ChatPageContext | null,
  /** The conversation's own model/temperature (SPEC-238); omitted when unset. */
  override?: ChatModelOverride | null,
  /** Fires once with the model that will answer and whether it was overridden. */
  onModel?: (model: string, temperature: number | null, overridden: boolean) => void,
  /** SPEC-249: the project a NEW thread starts in; ignored for an existing one. */
  projectId?: string | null,
  /** SPEC-293: the digital employee to talk to (backend SPEC-287); absent → Glisp. */
  employee?: string | null,
  /** SPEC-355 / backend SPEC-363: edit and resend. */
  edit?: {
    /** The stored question this one replaces, with everything after it. */
    replaceFrom?: number | null;
    /** Fires once with the id the server stored this question under. */
    onUserMessageId?: (id: string) => void;
  },
): Promise<AssistantTurn> {
  const response = await fetch(`${apiBase()}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: prompt,
      conversation_id: conversationId,
      ...(context ? { context } : {}),
      ...(override?.model ? { model: override.model } : {}),
      ...(override?.temperature !== undefined ? { temperature: override.temperature } : {}),
      ...(projectId ? { project_id: projectId } : {}),
      ...(employee ? { employee } : {}),
      ...(edit?.replaceFrom ? { replace_from: edit.replaceFrom } : {}),
    }),
  });
  if (!response.ok || !response.body) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error?.message ?? "The assistant is unavailable right now.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let reply = "";
  let finished = false;
  let messageId: string | null = null;
  let sources: ChatSources | null = null;

  /** Consume frames until the stream closes. Returns once `done` is seen so the
   *  caller can commit; keeps reading afterwards for the chips (SPEC-223). */
  const pump = async (onFinished: () => void): Promise<void> => {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const frames = buffer.split("\n\n");
      buffer = frames.pop() ?? "";
      for (const frame of frames) {
        if (!frame.startsWith("data: ")) continue;
        let parsed: SseFrame;
        try {
          parsed = JSON.parse(frame.slice(6)) as SseFrame;
        } catch {
          continue;
        }
        if (parsed.error) {
          throw new Error(parsed.detail ?? "The assistant hit an error.");
        }
        if (parsed.user_message_id != null) {
          edit?.onUserMessageId?.(String(parsed.user_message_id));
        }
        if (parsed.model) {
          onModel?.(parsed.model, parsed.temperature ?? null, Boolean(parsed.overridden));
        }
        if (parsed.delta) {
          reply += parsed.delta;
          onDelta?.(reply);
        }
        if (parsed.suggestions?.length) {
          onSuggestions?.(parsed.suggestions);
        }
        if (parsed.status) {
          onStatus?.(parsed.status);
        }
        if (parsed.done && !finished) {
          finished = true;
          messageId = parsed.message_id == null ? null : String(parsed.message_id);
          sources = parsed.sources ?? null;
          onFinished();
        }
      }
    }
  };

  // The backend now sends `done` BEFORE generating follow-up chips (SPEC-232),
  // which is a second LLM round trip. Resolving at stream close made the reader
  // wait through it with the answer already complete on screen.
  return await new Promise<AssistantTurn>((resolve, reject) => {
    const settle = () =>
      resolve({
        reply: reply.trim() || "I could not produce an answer — please try again.",
        messageId,
        sources,
      });
    pump(settle)
      .then(settle) // stream closed without a `done` frame
      .catch((error: unknown) => (finished ? undefined : reject(error)));
  });
}

// ── Talk to Glisp — the live call (SPEC-273) ─────────────────────────────────

export async function getVoiceStatus(): Promise<VoiceStatus> {
  const response = await fetch(`${apiBase()}/chat/voice/status`, { cache: "no-store" });
  if (!response.ok) throw new Error(await failureMessage(response, "Voice is unavailable"));
  return (await response.json()) as VoiceStatus;
}

/** One exchange the server stored in the thread, announced by a `turn` frame. */
export interface LiveTurn {
  messageId: string | null;
  /** The owner's words, as heard. */
  you: string;
  /** Glisp's words, as spoken (as far as they got if cut short). */
  content: string;
  model: string | null;
  sources: ChatSources | null;
}

export interface LiveCallInfo {
  id: string;
  conversationId: string;
  provider: "openai" | "gemini";
  voice: string;
}

export interface LiveCallHandlers {
  /** The line is open: `id` for the audio POSTs, the thread it lands in. */
  onCall?: (call: LiveCallInfo) => void;
  /** The model is connected and hearing. */
  onListening?: () => void;
  /** The owner's words, as the model hears them (updated while they speak). */
  onYou?: (text: string) => void;
  onStatus?: (status: string) => void;
  /** Glisp's words so far, in this reply. */
  onDelta?: (accumulated: string) => void;
  /** One chunk of Glisp's voice, PCM16 mono 24 kHz, as it is spoken. */
  onAudio?: (pcm16: Int16Array) => void;
  /** The owner spoke over Glisp — stop playing now. */
  onInterrupted?: () => void;
  onTurn?: (turn: LiveTurn) => void;
  /** A failure the pane should show; the line ends after it. */
  onError?: (code: string, detail: string) => void;
}

interface LiveFrame {
  call?: { id: string; conversation_id: string; provider: "openai" | "gemini"; voice: string };
  listening?: boolean;
  you?: { text: string };
  status?: string;
  delta?: string;
  audio?: string;
  interrupted?: boolean;
  turn?: {
    message_id: number | null;
    you: string;
    content: string;
    model: string | null;
    sources: ChatSources | null;
  };
  error?: string;
  detail?: string;
  ended?: string;
}

export class VoiceTurnError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "VoiceTurnError";
  }
}

/**
 * Open a live call: one `POST /chat/live` whose response is the line. Resolves
 * with the reason the line ended once the stream closes; rejects with a
 * `VoiceTurnError` when it could not open. `signal` hangs up.
 */
export async function openLiveCall(
  handlers: LiveCallHandlers,
  options: {
    conversationId?: string | null;
    projectId?: string | null;
    context?: ChatPageContext | null;
    signal?: AbortSignal;
  } = {},
): Promise<string> {
  const { base64ToPcm16 } = await import("@/lib/voice-turn");
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (options.context) headers["X-Chat-Context"] = JSON.stringify(options.context);
  const body: Record<string, string> = {};
  if (options.conversationId) body.conversation_id = options.conversationId;
  if (options.projectId) body.project_id = options.projectId;
  let response: Response;
  try {
    response = await fetch(`${apiBase()}/chat/live`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: options.signal,
    });
  } catch (error) {
    if (options.signal?.aborted) return "hung_up";
    throw error;
  }
  if (!response.ok || !response.body) {
    throw new VoiceTurnError(
      response.status === 409 ? "voice_unavailable" : "voice_failed",
      await failureMessage(response, "Voice is unavailable"),
    );
  }
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let reply = "";
  let ended = "ended";
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const frames = buffer.split("\n\n");
      buffer = frames.pop() ?? "";
      for (const frame of frames) {
        if (!frame.startsWith("data: ")) continue;
        let parsed: LiveFrame;
        try {
          parsed = JSON.parse(frame.slice(6)) as LiveFrame;
        } catch {
          continue;
        }
        if (parsed.call) {
          handlers.onCall?.({
            id: parsed.call.id,
            conversationId: parsed.call.conversation_id,
            provider: parsed.call.provider,
            voice: parsed.call.voice,
          });
        }
        if (parsed.listening) handlers.onListening?.();
        if (parsed.you) handlers.onYou?.(parsed.you.text);
        if (parsed.status) handlers.onStatus?.(parsed.status);
        if (parsed.delta) {
          reply += parsed.delta;
          handlers.onDelta?.(reply);
        }
        if (parsed.audio) handlers.onAudio?.(base64ToPcm16(parsed.audio));
        if (parsed.interrupted) handlers.onInterrupted?.();
        if (parsed.turn) {
          reply = "";
          handlers.onTurn?.({
            messageId: parsed.turn.message_id === null ? null : String(parsed.turn.message_id),
            you: parsed.turn.you,
            content: parsed.turn.content,
            model: parsed.turn.model,
            sources: parsed.turn.sources,
          });
        }
        if (parsed.error) handlers.onError?.(parsed.error, parsed.detail ?? "Voice failed.");
        if (parsed.ended) ended = parsed.ended;
      }
    }
  } catch (error) {
    if (options.signal?.aborted) return "hung_up";
    throw error;
  }
  return ended;
}

/** The owner's voice as it is captured — PCM16 mono 24 kHz, ≤ 2 s per POST. */
export async function sendLiveAudio(callId: string, pcm: Int16Array): Promise<void> {
  const response = await fetch(`${apiBase()}/chat/live/${encodeURIComponent(callId)}/audio`, {
    method: "POST",
    headers: { "Content-Type": "application/octet-stream" },
    body: new Blob([pcm.slice().buffer as ArrayBuffer]),
    // never `keepalive`: Chrome refuses a keepalive body over 64 KB, and a
    // coalesced chunk on a slow link is bigger than that — the audio would vanish
  });
  if (!response.ok) throw new VoiceTurnError("live_call_not_found", "The line is closed.");
}

export async function interruptLiveCall(callId: string): Promise<void> {
  await fetch(`${apiBase()}/chat/live/${encodeURIComponent(callId)}/interrupt`, {
    method: "POST",
    keepalive: true,
  });
}

export async function endLiveCall(callId: string): Promise<void> {
  await fetch(`${apiBase()}/chat/live/${encodeURIComponent(callId)}`, {
    method: "DELETE",
    keepalive: true,
  });
}

/**
 * `text` read in Glisp's voice (SPEC-273), streamed: `onChunk` receives PCM16
 * mono 24 kHz as it is produced, so playback starts on the first chunk. Resolves
 * when the reading is complete; rejects with a `VoiceTurnError` when it cannot
 * start. `signal` stops it.
 */
export async function streamSpeech(
  text: string,
  onChunk: (pcm16: Int16Array) => void,
  signal?: AbortSignal,
): Promise<void> {
  const response = await fetch(`${apiBase()}/chat/speech`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
    signal,
  });
  if (!response.ok || !response.body) {
    throw new VoiceTurnError(
      response.status === 409 ? "voice_unavailable" : "voice_failed",
      await failureMessage(response, "Read aloud is unavailable"),
    );
  }
  const reader = response.body.getReader();
  let carry = new Uint8Array(0);
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    let bytes = value;
    if (carry.length > 0) {
      bytes = new Uint8Array(carry.length + value.length);
      bytes.set(carry, 0);
      bytes.set(value, carry.length);
    }
    const even = bytes.length - (bytes.length % 2);
    carry = bytes.slice(even);
    if (even > 0) onChunk(new Int16Array(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + even)));
  }
}
