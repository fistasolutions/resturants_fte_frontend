# SPEC-238 — AI providers as cards, and a model picker in Chat

**Date:** 2026-09-14 · **Repo:** frontend · **Status:** implemented
**Backend counterpart:** `SPEC-245-ai-providers.md` (`/ai-providers`, `/chat/models`,
`POST /chat` `model` + `temperature`, `MessageOut.model/temperature`)
**Replaces:** the static "AI Model" card (SPEC-117 / SPEC-120 `ai-model-card.tsx`).

## Behaviour

### Integrations › AI providers (one card per key)

1. **"Add provider"** opens a dialog: a dropdown (Anthropic / OpenAI / Google Gemini),
   the API key (write-only; never shown again), a model dropdown for that provider
   (curated catalog from `lib/ai-models.ts`), **Test** (a real 1-token call with the
   typed key — shows ✓ and latency or the owner-readable reason) and **Save**. Saving
   an already-added provider replaces its key.
2. **Each provider is a card**: name, status pill (Connected · tested ✓ / Not tested /
   Test failed · reason), a **model** dropdown (saves on change), a **"Default for the
   whole system"** switch (turning one on turns the others off; the card that is default
   shows it as a badge), **Test** and **Delete** (confirm dialog). Deleting the default
   shows a warning banner: *"No default provider — the system is using the `.env` key
   until you choose one."*
3. **Env-only providers** (key in `.env`, not added here) show as a muted card with a
   ".env" badge and an **Add** action instead of Delete / Default.
4. **Image generation default** — a small select listing only the OpenAI / Gemini cards
   present (Anthropic never appears). Saves on change.
5. **Video (Google Veo)** — one static card: fixed provider, its own key field, Test,
   Save, Remove; states: *Using your Gemini key* / *Own key* / *Not configured*. Never
   deletable as a card, never a default.
6. The card reads `integrationQueries.aiProviders()`; every mutation writes the returned
   overview into that cache (`setQueryData`) — instant, one request.

### Chat › model picker (page and drawer)

7. A **Model** button in the chat header (page: next to the title; drawer: an icon)
   opens a popover: the models of every provider that has a key, grouped by provider,
   with the current default marked; a **temperature** slider (0 → the provider's
   ceiling, step 0.1) and **"Use system default"**. The choice is **per conversation**
   (a new chat starts from the default), sent with every message as `model` /
   `temperature`, and shown as a small tag on each reply — the streaming bubble shows
   it from the stream's opening `model` frame, stored replies from `MessageOut`.
8. Nothing changes for a conversation that never touches the picker: no `model` /
   `temperature` in the request, no tag.

## Implementation

- `types/ai-providers.ts`, `lib/queries/integrations.ts` (`aiProviders`),
  `lib/queries/chat.ts` (`chatQueries.models`), `services/ai-providers.ts` (client
  mutations), `lib/ai-providers.ts` (pure: option builders, labels, temperature
  bounds, `modelTag`), Vitest.
- `features/integrations/ai-providers-card.tsx` (+ `add-provider-dialog.tsx`,
  `ai-provider-row.tsx`, `ai-video-card.tsx`); `integrations-view.tsx` swaps the old
  card; `types/integrations.ts` + `lib/queries/integrations.ts` drop `ai` (the backend
  no longer sends it). `ai-model-card.tsx` deleted.
- `features/chat/model-picker.tsx`; `use-chat-session.ts` holds the per-conversation
  override and passes it to `getAssistantReply`; `services/chat.ts` sends it and
  surfaces the `model` frame; `message-bubble.tsx` shows the tag; `types/chat.ts`
  `ChatMessage.model/temperature`, `ChatModelOverride`.
- Docs (Rule 11): integrations doc section "AI providers", chat doc section "Model
  and temperature", overview "AI model providers" line.

## Acceptance criteria

- [x] Add → Test → Save creates a card; the first one is default + image default.
- [x] Default switch is exclusive; deleting the default shows the env warning.
- [x] Image default select never offers Anthropic.
- [x] Video card: own key / Gemini key / not configured states; Test works.
- [x] Chat picker lists only keyed providers; a chosen model appears as a tag on the
  reply and in history after reload; a fresh conversation sends no override.
- [x] `npm test`, `npx tsc --noEmit`, `npm run lint`, `npm run build` green.

## Verification (2026-09-14)

`npm test` 122 files / 1489 tests (new `tests/ai-providers.test.ts`, 10 cases;
`integration-config` and `chat-service` fixtures updated; `query-registries` pins the
`chat` registry and `integrations.aiProviders`), `npx tsc --noEmit`, `npm run lint`
(0 errors), `npm run build` green. Live (Playwright, 12/12, zero page errors): the
migrated Gemini card renders with Default + Images badges; Test on it → Connected and
the pill flips to "Connected · tested" without a second request; the image-default
select offers only Google (Gemini); the Veo card reads "Using your Gemini key" and its
Test succeeds; the add dialog with a bogus key shows the owner-readable rejection and
saves nothing; in Chat the picker set "Gemini 3.6 Flash · t 0.2", the request carried
`model`/`temperature`, the reply was tagged live, the tag survived a reload, and a new
chat started on "Default model". Captures under `ref/screens/ai-providers-2026-09-14/`
feed the docs (`integrations-ai-providers`, `chat-model-picker`).

## Patches

- **2026-09-14 — the picker moved into the composer (owner direction, with two
  reference shots).** Not a header button: a quiet pill at the **bottom-left of the
  message box** (page and drawer alike — `ChatComposer` gained a `tools` slot and a
  two-row layout: text on top, pill · Send underneath). It opens **upward** into a
  list of the **whole catalog**: provider groups, each model with its name, a tier
  badge and the catalog's one-line description, a check on what this thread runs on,
  a **lock ("needs a provider")** on models whose provider has no key (listed, not
  hidden — `GET /chat/models` now returns every model with `available`), and the
  temperature slider tucked at the bottom with "Reset to default". Within a provider
  the order is the curated catalog's (best first), not the backend's alphabetical.
  `lib/ai-models.ts` gained `gemini-2.5-pro` (retired — named honestly) and an honest
  2.5 Flash blurb; `ModelPicker` has no `compact` mode any more. Docs and the
  `chat-model-picker` capture updated. Live: pill → "Gemini 3.8 Flash · t 0.3" → the
  request carried both → tagged reply.


## Patches

- **2026-09-18 — three quick fixes from the owner's review.** (1) The panel's "Open
  the full workspace" link is now a bordered, tinted, underlined row — it read as a
  caption. (2) The picker: a **search box** at the top (`filterPickerGroups` — name ·
  provider · tier · blurb), **compact rows** (12/10 px, blurb on one line), the
  **chosen model pinned first** under "Your choice" (`pinnedPickerOption`), and an
  unavailable model says **"Unavailable — no key on Integrations"** instead of "needs a
  provider". (3) The **Voice replies** switch is removed from the composer for now
  (the read-aloud store stays; nothing turns it on). Tests in
  `tests/ai-providers.test.ts`; verified live in the panel.
