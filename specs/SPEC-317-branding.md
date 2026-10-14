# SPEC-317 — Branding: your logo in the app, your picture on the login screen

**Repo:** frontend · **Status:** implemented · **Date:** 2026-09-28
**Programme:** `SPEC-311-saas-platform-master.md`, slice **F7**
**Backend contract:** backend SPEC-318 —
`GET /organizations/current/branding` (`{name, slug, logo: {light, dark}, login: {kind, items,
poster}}`, each asset `{id, media_type, width, height, url}`); `PUT …/branding/logo/{light|dark}`
(multipart `file`: PNG/JPEG/WebP ≤ 2 MB); `DELETE …/branding/logo/{variant}`;
`PUT …/branding/login-media` (multipart `kind` = image | video | carousel, `files` (1 image ≤
10 MB · 1 MP4/WebM ≤ 25 MB · 2–6 images), optional `poster`); `DELETE …/branding/login-media`.
Reads need membership; writes need `settings.manage`. `GET /workspace` already carries
`branding` (backend SPEC-319).
**Follows:** SPEC-312 (the login screen already shows an organization's media).

## Why

The owner (D10): a white-label product — each organization's own logo in the app and its own
image, video or carousel on its login screen, set by the organization, not by us.

## Behaviour

**Settings → Branding** (`/settings/branding`, after Roles):
- **Logos:** two cards, *For light backgrounds* and *For dark backgrounds*, each previewing the
  current logo on a matching surface (or the platform mark with "Using the Ecommerce FTE logo").
  **Upload** (PNG, JPEG or WebP, up to 2 MB — checked before sending) and **Remove** (confirmed).
- **Login screen:** the current choice previewed (image, the video with its poster, or the
  carousel's images in order). **Change** opens a chooser:
  - *Image* — one picture (JPEG, PNG or WebP, up to 10 MB).
  - *Video* — one MP4 or WebM (up to 25 MB), with an optional poster image shown while it loads.
  - *Carousel* — 2 to 6 pictures; each can be moved earlier/later or removed before saving.
  - The files are checked in the browser (type, size, count) before anything is sent; the
    backend's refusal (`unsupported_media`, `media_too_large`, `login_media_invalid`) is shown in
    its words. **Save** replaces what was there. **Remove** returns the login screen to the
    platform default (confirmed).
- A member without `settings.manage` sees the previews, without the buttons.

**In the app:** the sidebar shows the organization's logo (light logo in the light theme, dark
logo in the dark; either one stands in for the other when only one is set), and the phone
header shows the organization's name. With no logo set, the platform mark stays. This costs no
extra read: the app layout's `/workspace` read already carries the branding (SPEC-315 reads it);
the layout now keeps the whole answer, not only the navigation.

**Uploads through the proxy:** `proxy.ts` (Next 16's request gate) returns early for every
`/api/*` path, but still buffers a request body up to its 10 MB default before doing so, which
would cut a 25 MB video or a six-image carousel. `/api/` is removed from its matcher — the gate
already did nothing there, so behaviour is unchanged and uploads reach `/api/proxy` whole.

## How

- `lib/workspace.ts` (pure): `toWorkspace` — the `/workspace` answer as the layout needs it
  (navigation, brand name + logo URLs through `viaProxy`, organization features and calendar,
  store currency and timezone; every part tolerant of an older backend). `services/workspace.ts`
  `getWorkspace()` replaces `getWorkspaceNavigation()`.
- `lib/branding.ts` (pure): `toBranding` (API → view, URLs via `viaProxy`); limits and accepted
  types; `checkLogo(file)`, `checkLoginMedia(kind, files, poster)` → the first problem in words or
  null; `moveItem`, `removeItem` for the carousel order; `sidebarLogos(light, dark)`.
- `lib/queries/branding.ts` — `brandingQueries.current()`; pinned in the registry test.
- `services/branding.ts` — `uploadLogo`, `removeLogo`, `setLoginMedia`, `clearLoginMedia`
  (multipart through `/api/proxy`, throwing `ApiError`).
- `features/settings/branding-view.tsx`, `logo-card.tsx`, `login-media-card.tsx`; page
  `app/(app)/settings/branding/page.tsx`; the tab in `settings-tabs.tsx` / `settings-shell.tsx`.
- `components/layout/app-sidebar.tsx` takes `brand` (name + logos); `app/(app)/layout.tsx`
  passes it and the name to the phone header. A save refreshes the router so the sidebar picks
  the new logo up.
- Settings doc gets a Branding section (root Rule 11).

## Tests

Vitest: `toWorkspace` (full, missing parts, null); `toBranding`; `checkLogo` (type, size, ok);
`checkLoginMedia` per kind (count, type, size, poster type, ok); `moveItem`/`removeItem` (bounds);
`sidebarLogos` (both, one, none); the registry. `npm test`, `npx tsc --noEmit`, `npm run build`
green. Manual: upload both logos and see the sidebar change in both themes; set an image, a video
with a poster, a 3-image carousel reordered, and see each on `/login?org=<slug>`; a 30 MB video is
refused before upload; a member without `settings.manage` sees previews only; phone width.

## Acceptance criteria

- [x] Logos: upload, preview on the right surface, remove; the sidebar shows them per theme.
- [x] Login screen: image, video (+ poster), carousel (ordered, 2–6); remove back to default.
- [x] Files checked before sending; the backend's refusal shown in its words.
- [x] No added round trip on page load; uploads up to 25 MB reach the backend whole.
- [x] Settings doc updated; tests, type-check and build green.

## Verification (2026-09-28)

`npm test` 2,093 passed (185 files; 12 new in `tests/branding.test.ts`, the registry test
extended); `npx tsc --noEmit` clean; eslint clean on every touched file; `npm run build` green.
All five criteria done in code; the upload-and-see pass (both themes, `/login?org=`) runs against
the new deployment.

## Patches

### 2026-09-28 — "Your team's login link" (owner request)

The owner chose the `?org=` link over subdomains or custom domains as each organization's branded
login address. Settings → Branding now opens with a **Your team's login link** card
(`features/settings/login-link-card.tsx`): the link (`lib/branding.ts` `loginLink(slug, origin)`,
the slug now kept by `toBranding` from backend SPEC-318's `slug`), **Copy** (clipboard, with a
refusal message when the browser blocks it) and **Open** (new tab). The server render shows the
path; the browser adds its own origin once hydrated (`useHydrated`), so they never disagree.
Shown to every member — the link reveals nothing a login page does not. Tests: `loginLink` (path,
origin with a trailing slash, escaping) and `toBranding` keeping the slug. Settings doc updated.
