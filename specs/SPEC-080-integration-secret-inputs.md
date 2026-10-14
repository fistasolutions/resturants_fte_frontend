# SPEC-080 — Write-Only Secret Inputs (SPEC-077 follow-up)

## Problem

SPEC-077 showed a plain sentence for each provider's credential
("configured on the server") with no way to set or rotate it from the
UI. Backend SPEC-072 now accepts these fields — write-only, encrypted
at rest, never returned. This adds the matching input to
`ConfigurableIntegrationCard`.

## Design

- Each provider's `PROVIDER_META` gains a `secretFields` list
  alongside the existing non-secret `fields` — SMTP: `user`,
  `password`; Klaviyo: `private_key`; Gorgias: `api_token`.
- Rendered as a `type="password"` input, **always blank on load** —
  the server never sends a value back, so there's nothing to prefill.
  Placeholder text reads `"Configured on the server"` or `"Not
  configured"` depending on `secrets[key].configured`, so the blank
  box still communicates current state at a glance.
- Left untouched (blank) on submit, the field is simply omitted from
  the PUT payload — saving the non-secret fields must never
  accidentally clear an already-configured secret just because its
  input was left empty. Only a field the user actually typed into is
  sent.
- After a successful save, the input clears back to blank again (it
  never echoes back what was typed) — reinforcing that this is a
  set-only action, not something you can review afterward.
- Same visual language as the rest of the card: one shared `Input`
  component, no new design pattern.

## Acceptance Criteria

- [x] Secret inputs render blank regardless of `configured` state;
      placeholder communicates whether one exists.
- [x] Only actually-edited secret fields are included in the PUT
      body — an untouched blank input never sends `""` and clears an
      existing credential (`handleSubmit` filters `secretValues` to
      non-empty entries before merging into the request).
- [x] After save, secret inputs reset to blank; the badge/placeholder
      update from the response's new `secrets`/`secret_configured`.
- [x] `npx tsc --noEmit` clean, `npm run lint` clean on every touched
      file (4 pre-existing errors remain elsewhere, unrelated), `npm
      test` 241/241 green, `npm run build` green. Live end-to-end
      verification against the real backend: PUT a test Gorgias API
      token → response never contained the plaintext anywhere, the
      provider's `secret_configured` flipped to `true`, and the raw
      database row was confirmed to be 140 bytes of ciphertext, not
      the plaintext — then cleared back out to restore prior state.

## Patches

- Client asked for an explicit per-field badge showing where a
  value/status comes from (Database / `.env` / Not set), not just a
  hint paragraph shown only in the `.env` case. Added a shared
  `SourceBadge` next to every field's label — editable fields use
  their existing `source`; secret fields now carry one too (backend
  SPEC-072 Patch). Kept the "type a new value to replace it" line for
  configured secrets since that's actionable guidance, not just
  status. `npx tsc --noEmit`, `npm run lint`, `npm test` (241/241),
  and `npm run build` all green; live-verified read-only against the
  real backend that `secrets.<key>.source` now resolves correctly.
