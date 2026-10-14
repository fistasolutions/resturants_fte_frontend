# SPEC-266 — Your model: the picker's choice sticks until you change it

**Date:** 2026-09-17 · **Repo:** frontend · **Status:** implemented
**Backend twin:** `SPEC-266-chat-model-preference.md` (`PUT /chat/model`, `preferred` on `GET /chat/models`).
**Supersedes** the per-conversation semantics of SPEC-238's picker (owner direction 2026-09-17).

## Behaviour

- The model (and temperature) picked in the composer's pill is **the account's chat
  model**: it is saved the moment it is picked and applies to this chat, every new
  chat, the Ask Glisp panel, and after signing in again on any device — until the
  owner picks something else. "System default" clears it.
- The pill shows the remembered choice everywhere; the popover's first line reads
  "Sets what Glisp runs on for you — this chat, new chats and the panel — until you
  change it. Every other agent keeps the system default."
- Every send carries the choice explicitly (the backend also falls back to it when
  nothing is sent, so old clients behave the same). The runtime label on the answer
  card keeps showing what actually answered.
- A save that fails (a provider whose key was just removed) shows the server's reason
  under the list and leaves the previous choice in place.

## Implementation

- `types/ai-providers.ts` — `ChatModels.preferred`.
- `services/chat.ts` — `setChatModel(preference)` (`PUT /chat/model`).
- `lib/chat-model-preference.ts` — pure: `preferenceToOverride`, `overrideToPreference`,
  `withPreferred` (cache update). Tests in `tests/chat-model-preference.test.ts`.
- `features/chat/use-chat-session.ts` — `override` reads the shared `chat/models`
  cache; `setOverride` writes it optimistically, saves, and reverts on failure. The
  per-conversation `overrides` map is gone.
- `features/chat/model-picker.tsx` — wording; the error line.
- Docs: `lib/docs/content/chat.ts` model-picker section rewritten.

## Acceptance criteria

- [x] Pick Gemini 3.5 Flash on /chat → open a new chat → the pill still says Gemini 3.5 Flash; open the panel on another page → same; reload → same; `GET /chat/models.preferred` carries it.
- [x] System default clears it everywhere.
- [x] `npm test`, `tsc`, lint, `npm run build` green; docs updated.
