# SPEC-302 — The eye on every secret field

**Status:** done
**Date:** 2026-09-24
**Repo:** frontend
**Depends on:** backend SPEC-297, frontend SPEC-080 (integration secret inputs)

## Why

The Integrations cards say *Configured on the server* and stop there, so the owner cannot
see which key is actually in place. He asked for the value, behind an eye icon.

## What ships

In `features/integrations/configurable-integration-card.tsx`, every secret input gains an
**eye button** on its right:

- **Closed eye** (default) — the field reads as it does today: `Configured on the server`
  or `Not configured`, and typing still replaces the stored value.
- **Click** — one request to `GET /settings/integrations/{provider}/secrets/{key}`, then
  the real value in the box, in `font-mono`, `readOnly` while revealed so a stray keypress
  cannot half-edit a credential.
- **Click again** — back to the placeholder, and the fetched value is dropped from state.
- Unset fields keep the eye disabled with a title saying there is nothing to show.
- A failed read shows the error inline; it never empties the field.

`lib/integration-secrets.ts` (pure, Vitest-covered): `secretFieldLabel`, `revealTitle`
(what the button announces in each state), `canReveal(status)` and `maskedPlaceholder`.

The input is `type="text"` only while revealed, `type="password"` otherwise, so the
browser's own password manager never offers to save a revealed value.

## Acceptance criteria

1. An eye sits on every secret field; a configured field reveals its value on click and
   hides it again, fetching once per reveal.
2. An unset field's eye is disabled and explains why.
3. A revealed field is read-only and monospace; typing is possible only when hidden.
4. `lib/integration-secrets.ts` is pure and unit-tested.
5. `npm test`, `tsc`, `lint`, `build` green; verified in the browser on the live page.

## Verification

Driven live on 2026-09-24 (production build on :3100, reload-free backend on :8100;
captures in `ref/screens/secret-eye-2026-09-24/`).

- **8 secret fields** render the eye; the rendered HTML carries no credential before a
  click.
- Pressing it fetched the Gorgias token (64 chars) into a **read-only, monospace** box with
  `type="text"`; pressing again emptied it and restored `type="password"`.
- An unset field's eye is disabled and titled *"Nothing is configured yet"*.
- `tests/integration-secrets.test.ts` — 6 cases over the pure half.
- **Gates:** `npm test` 1,956 passed (172 files), `tsc` clean, `lint` 0 errors (3
  pre-existing warnings), `npm run build` compiled.

### Acceptance criteria

| # | Criterion | Status |
| --- | --- | --- |
| 1 | An eye on every secret field; reveal and hide, one fetch per reveal | done |
| 2 | An unset field's eye is disabled and explains why | done |
| 3 | A revealed field is read-only and monospace | done |
| 4 | `lib/integration-secrets.ts` pure and unit-tested | done |
| 5 | Suite, types, lint, build green; verified in the browser | done |

## Patches

- **2026-09-24 — the second look is instant.** The first cut dropped the value on hide, so
  showing it again paid for another round trip (**1,655 ms** on the remote database). The
  card now keeps what it has read: `fetched` holds the values this card fetched, `shown` is
  what is on screen, and `revealAction` (pure) decides between hide · show · fetch.
  Measured live: first reveal **1,655 ms / 1 request**, hide and reveal again **33 ms / 0
  further requests**. A successful save clears both — the stored credential just changed,
  so what was read is stale.
