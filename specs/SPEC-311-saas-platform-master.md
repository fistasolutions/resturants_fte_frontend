# SPEC-311 — Ecommerce FTE as a multi-tenant SaaS: the frontend plan

**Repo:** frontend · **Status:** approved plan, slices follow the backend · **Date:** 2026-09-26
**Contract:** backend `SPEC-308-saas-platform-master.md` — the owner's decisions D1–D13 live
there and bind this spec too. This spec only adds what is frontend-specific.

## Why

Today the frontend assumes one user, one store and one brand: `/login` is the only public page,
`/auth/me` returns `{name, email}`, every query key is store-less (`lib/query-def.ts` says so),
the logo and product name are hard-coded, the sidebar draws all 23 destinations to everyone, and
nothing handles "no store connected". A SaaS needs the opposite on every one of those points.

## Principles

1. **The backend is the authority; the frontend discloses.** Permissions, connections and
   features come from one read (`GET /workspace`, backend S10). The UI hides what a user cannot
   use or has not connected (D12) — but hiding is never the security boundary.
2. **Frictionless first minutes.** Signup → organization → plan → connect Shopify → a dashboard
   that fills as the 30-day sync lands. Each step is one screen, one primary action, and resumes
   where it left off after a reload.
3. **No cross-tenant leakage in the browser.** Every cached query and every `localStorage` key is
   scoped by organization; switching organization clears the in-memory cache.
4. **White label is data.** Logo and login media come from the organization; the product never
   hard-codes a store's identity (root `CLAUDE.md` white-label rule).
5. Root rules still apply: Next 16 conventions (`node_modules/next/dist/docs/`), tokens only, no
   Framer Motion, persistent shells, logic in `lib/` under Vitest, in-app docs updated per feature.

## Slices (each gets its own spec before code)

| Slice | Scope | Needs backend |
| --- | --- | --- |
| **F1** Session & tenancy plumbing | `UserProfile` gains id + organizations + active organization; organization switcher; query keys and storage keys scoped by organization; cache cleared on switch; `proxy.ts` understands "signed in, no organization yet" | S1 |
| **F2** Auth screens | `/login` (email+password · Continue with Google · Continue with Shopify), `/signup`, `/verify` (OTP), `/forgot` + `/reset` (OTP), `/invite/[token]`; all public in `proxy.ts`; the login screen shows the organization's media (image · video · carousel) when this device last signed into one | S4, S9 |
| **F3** Onboarding | `/onboarding` wizard: organization → plan (three bands, D5) → dummy checkout → connect Shopify (link) → first sync | S5, S6 |
| **F4** First-connect experience | live progress toasts from the bootstrap stream; pages reveal as their data becomes ready; skeletons, never errors, while syncing | S7 |
| **F5** Progressive disclosure | navigation, the Employees hub, the Ask Glisp prompts and the Docs list derived from `/workspace` (permissions × connections × features); section layouts refuse direct URLs a user cannot use | S8, S10 |
| **F6** Team & roles | Settings → Team (invite, change role, deactivate) and Settings → Roles (permission grid, custom roles); every write button gated by one `can()` | S8 |
| **F7** Branding | Settings → Branding: logo (light/dark), login media — choose image, video or carousel, then upload what fits | S9 |
| **F8** Per-organization product | `/ci` only when the feature is on; the Hebrew-calendar compare mode only when the organization's calendar is `hebrew`; currency and timezone from the store, not `utils/format.ts` constants; hard-coded brand strings removed | S2, S10 |

## Acceptance (programme level)

- [ ] A user of organization A never sees organization B's cached data, even after switching in the same tab.
- [ ] A new merchant reaches a dashboard with only Shopify-backed screens visible; each integration they connect reveals its screens.
- [ ] A role without a permission never sees the navigation item, the page, or the button for it.
- [ ] `npm test` and `npm run build` green at the end of every slice.
