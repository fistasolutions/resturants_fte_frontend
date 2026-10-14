# SPEC-120 — AI Model card on the Integrations page (dropdown + info modal)

## Context / Why

Backend SPEC-117 adds an `ai` integration provider (a `model` field + per-provider API
keys). Surface it as an **"AI Model"** card in the Integrations "Configure" section — but
unlike the text-only `ConfigurableIntegrationCard`, this one needs a **model dropdown**
and, per the request, an **ⓘ info button** that opens a modal describing the currently
selected model (what it's good at, and its **cost tier** — premium / balanced / economy).

## Scope
- **`lib/ai-models.ts`** — the catalog: `{ id ("<provider>/<model>"), label, provider,
  providerLabel, tier: "premium"|"balanced"|"economy", blurb }` for OpenAI / Anthropic /
  Gemini (incl. the cheap ones — Claude Haiku, Gemini Flash). Kept in sync with the
  backend `AI_MODEL_IDS` whitelist.
- **Types/services** — add `ai: ProviderSettings` to `IntegrationSettings` and the two
  adapters (`integration-settings.ts`, `integration-config.ts`).
- **`features/integrations/ai-model-card.tsx`** (client) — a dedicated card:
  - shadcn **Select** of the catalog models (grouped/labelled by tier), current = the
    saved model; a small tier badge.
  - **ⓘ button → Dialog** showing the selected model's label, provider, tier, and blurb
    (a short cost/what-it's-for note) — updates as the selection changes.
  - One **API-key** field for the **active provider** (derived from the selected model),
    write-only (placeholder "Configured on the server" when set) — mirrors the secret-field
    UX. "Connected" badge reflects the *active provider's* key being configured.
  - Save → `updateIntegrationSettings("ai", { model, <activeProvider>_api_key })`.
- **Integrations page** — render `<AiModelCard settings={integrations.ai} />` in Configure.

Semantic tokens only; no Framer Motion (shadcn Dialog/Select transitions only); brand red
never used for status. No calculations in the UI.

## Tests / verification (Rule 4/7)
`lib/ai-models.ts` is pure → unit-test the catalog (every id is `provider/model`, tiers
valid, provider matches id prefix). `tsc`/`lint`/`npm test`/`build` green. Manual: card
shows saved model; changing it + ⓘ shows the right description; save persists and the AI
actually uses the new model (backend overlay).

## Acceptance Criteria
- [ ] AI Model card renders with a working model dropdown + ⓘ info modal + provider key field.
- [ ] Saving switches the model (verified against backend) and stores the key encrypted.
- [ ] `npm run lint`, `npx tsc --noEmit`, `npm test`, `npm run build` green.

## Patches
- **2026-08-12 — two-dropdown (provider → model) + active summary.** Redesigned the card:
  a **Provider** dropdown (OpenAI/Anthropic/Google) then a **Model** dropdown scoped to that
  provider, both preselected from the env/DB value; a "Currently active" summary line above
  shows the persisted provider·model + its source badge (.env/Database). Added
  `openai/gpt-5-mini` to the catalog (the live env model) and `providerOf`/`optionFor`/
  `modelsForProvider` helpers so a non-catalog env model still shows selected instead of
  falling back to the wrong one.

### 2026-09-12 — Gemini catalogue refreshed; retired 2.5 Pro withdrawn from the dropdown

Google retired `gemini-2.5-pro` for new accounts (404 *"no longer available to new
users"*) the day the store moved its key from OpenAI to Gemini, and the model card only
offered two Gemini options — one of them that. Thirteen text-capable Gemini models are
now listed, taken from the live `/v1beta/models` response for the store's key rather
than from memory. The **`-latest` aliases** (`gemini-pro-latest`, `gemini-flash-latest`,
`gemini-flash-lite-latest`) are the ones to pick: they track Google's current model, so
the next retirement cannot break a deployment. `gemini-2.5-pro` is gone from the
dropdown but still accepted by the backend allowlist, so a store with it saved does not
fail an unrelated save. Specialised products in the same list (music, transcription,
robotics, deep-research, image) are deliberately excluded — they are not LLMs.
