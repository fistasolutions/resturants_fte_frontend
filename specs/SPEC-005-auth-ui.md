# SPEC-005 — Authentication UI (Login & Signup)

**Status:** Implemented
**Phase:** 1 — Frontend Foundation (docs/Phases.md: Authentication pages)
**Governing docs:** ../docs/prd.md §3 (Authentication), ../docs/Design.md §12 (Forms),
root CLAUDE.md Rules 6 (mock exception) / 9

## Goal

The Login and Signup pages from the Phase 1 page list — premium, centered, dark,
matching the dashboard's design language — backed by a mock auth service with the same
signatures the real JWT API will have (Phase 8 swap, root Rule 6 pattern).

## Scope

### Routes — `app/(auth)/`

- `(auth)/layout.tsx` — centered single-column layout on `bg-background`, brand mark
  (same tile as sidebar) above a `Card`; footer microcopy.
- `(auth)/login/page.tsx` — title "Welcome back", subtitle, `LoginForm`, link to
  `/signup`. Metadata title "Log in".
- `(auth)/signup/page.tsx` — title "Create your account", `SignupForm`, link to
  `/login`. Metadata title "Sign up".
- No forgot-password (not in PRD V1 scope).

### Components — `features/auth/`

- `login-form.tsx` (client) — email + password, show/hide password toggle, submit.
- `signup-form.tsx` (client) — name, email, password, confirm password, toggle, submit.
- Both per Design.md §12: labels tied by `htmlFor`, placeholders, inline field errors
  (set on blur/submit, cleared on change, `aria-invalid` + `aria-describedby`),
  disabled + loading submit state ("Signing in…"), submit-level error region
  (`role="alert"`). On success → `router.push("/")`.
- A muted "Preview mode — any valid credentials work" hint (honest Phase 1 UI, removed
  by the Phase 8 spec).

### Validation — `utils/validation.ts` (+ tests, Rule 4)

- `validateEmail` (required, RFC-ish shape), `validatePassword` (required, min 8
  chars), `validateName` (required, min 2), `validatePasswordConfirmation` (match).
  Return `string | null` error messages. Unit-tested in `tests/validation.test.ts`.

### Service — `services/auth.ts`

- `login({email, password}): Promise<UserProfile>` and
  `signup({name, email, password}): Promise<UserProfile>` — mock resolves the profile
  (login derives a display name from the email local part; no session persisted in
  Phase 1). Phase 8 swaps to the JWT endpoints via the proxy, same signatures.

### shadcn additions

- `label` component (form fields).

## Out of scope

Real authentication, sessions/guards, logout button placement (Settings page spec),
forgot password (not V1), social login (not in PRD).

## Accessibility

Labels on every input; errors announced (`aria-describedby`, alert region); password
toggle is a labeled button; full keyboard flow; one `h1` per page.

## Acceptance Criteria

1. `/login` and `/signup` render centered card UIs matching the app's tokens; brand
   consistent with the sidebar.
2. Field validation per rules above with inline messages; invalid submit focuses/marks
   fields and never navigates.
3. Valid submit shows loading state then lands on `/`.
4. Cross-links between login/signup work; nav-disabled tooltip pattern unaffected.
5. Validators fully unit-tested; `npm test` green.
6. `npm run lint`, `npx tsc --noEmit`, `npm run build` green.

## Manual verification checklist

- [ ] Tab through: every field, toggle, submit, cross-link reachable in order.
- [ ] Bad email/short password → inline errors, no navigation.
- [ ] Valid login → brief loading → dashboard.
- [ ] 375px: card fits with padding; no horizontal scroll.

## Patches

- 2026-07-15 — **Editorial split-screen redesign (owner feedback: centered card too boring for a fashion brand).** Desktop auth becomes a 50/50 split: left = the store campaign hero video (streamed from the store CDN, `preload="metadata"`, autoplay/muted/loop; local 1400px poster `public/brand/hero-poster.jpg` paints instantly and serves as the `prefers-reduced-motion` fallback) under a scrim gradient (new theme-invariant `--scrim` token) with the white logo + tagline; right = the form, de-carded to an editorial column. Mobile keeps the single-column form with the logo above. Demo-access hint unchanged.
- 2026-07-15 — **Hero video optimization (owner request).** The 23MB 1080p/7.2Mbps CDN stream is replaced by a self-hosted rendition (`public/brand/hero.mp4`): audio stripped, 1080px wide, H.264 CRF26 with `+faststart` → **4.4MB (-81- 2026-07-15 — **Hero video optimization (owner request).** The 23MB 1080p/7.2Mbps CDN stream is replaced by a self-hosted rendition (`public/brand/hero.mp4`): audio stripped, 1080px wide, H.264 CRF26 with `+faststart` → **4.4MB (-81%)**, starts instantly over the local poster; no external dependency remains on the auth pages.
- 2026-07-21 — **Hero tagline unreadable in dark mode (owner bug report).** The tagline + subline over the campaign video used `text-primary-foreground`, which is white in light mode but flips to dark ink in dark mode (`--primary` inverts per the dark palette), fading the copy into the photo. Fix: new **theme-invariant `--scrim-foreground: #ffffff`** token (companion to `--scrim` — text/icons over photography/video always stay white in both themes), mapped in `@theme inline`, and the two lines in `app/(auth)/layout.tsx` now use `text-scrim-foreground` / `text-scrim-foreground/80`. Manual check: toggle theme on `/login` at ≥1024px — tagline stays white over the video in both themes.
