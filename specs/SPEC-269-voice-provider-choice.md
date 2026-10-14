# SPEC-269 — Voice provider choice: Talk to Glisp on any card

**Date:** 2026-09-17 · **Repo:** frontend · **Status:** implemented
**Backend twin:** `SPEC-269-voice-providers.md`. Extends SPEC-268.

## Behaviour

- Integrations → AI providers gains a **Voice** box beside Image generation: "Default
  for voice" — OpenAI or Google Gemini (the cards that have speech models); Anthropic
  never appears. Nothing chosen = the first voice-capable card (OpenAI, then Gemini),
  and the box says which one is speaking. The choice is `PATCH /ai-providers/{provider}`
  `{is_voice_default: true}` — the same call the image default uses.
- The sphere (composer and pill) reads `GET /chat/voice/status` — `provider` tells the
  tooltip which voice will answer ("Talk to Glisp — Google Gemini voice"); the reason
  when none is available names both cards.
- Nothing else in the voice screen changes: the pipeline, the turn and the thread are
  provider-agnostic.

## Implementation

- `types/ai-providers.ts` — `AiProviderCard.is_voice_default`, `.voice_capable`,
  `AiProvidersOverview.voice_default`, `.voice_source`; `types/chat.ts` `VoiceStatus.provider`, `.options`.
- `lib/ai-providers.ts` — `voiceDefaultOptions(cards)`, `voiceProviderLabel`.
- `services/ai-providers.ts` — `updateAiProvider` accepts `is_voice_default`.
- `features/integrations/ai-providers-card.tsx` — the Voice box.
- `features/chat/talk-button.tsx` — the tooltip names the voice.
- Docs: integrations "AI providers" section + chat "Talk to Glisp" prose.

## Acceptance criteria

- [x] With only a Gemini card, the Voice box shows Google Gemini speaking and the sphere is enabled; flagging a card updates the overview.
- [x] A real spoken turn on the live store's Gemini card round-trips (backend measured).
- [x] `npm test`, `tsc`, lint, `npm run build` green; docs updated.
