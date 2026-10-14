# SPEC-227 — Route error boundaries

Status: implemented
Depends on: SPEC-017 (`lib/api.ts`, `ApiError`, the session cookie), SPEC-119 (the
instant-header / skeleton pattern these mirror on the failure path)

## Problem

The app has **46 `loading.tsx` files and zero error boundaries** — no `error.tsx`, no
`global-error.tsx`, no `not-found.tsx`. Every route is dynamic and every page fetches
through `serverApi`, which throws `ApiError` on any non-2xx. So the loading state is
handled everywhere and the failure state is handled nowhere.

What a user gets today when the backend is down, their session expired mid-session, or
a single endpoint 500s: Next's unstyled default error screen, outside the app shell,
with no explanation, no way back, and no reference to quote. On a business-intelligence
tool people open every morning, that is the difference between "the sync is behind" and
"the product is broken".

## The shape of the fix — four boundaries, not forty-six

The instinct from the count is "46 `loading.tsx`, so 46 `error.tsx`". That is wrong. An
error boundary catches everything **below** it, so one boundary per layout level covers
every route beneath it, and forty-six copies of the same file would be forty-six places
to fix the next change.

What actually decides the file count is which boundary can catch which throw:

| File | Catches | Renders |
| --- | --- | --- |
| `app/(app)/error.tsx` | any page under `(app)` — all 21 feature routes | **inside** the app shell: sidebar and nav intact |
| `app/error.tsx` | `app/(app)/layout.tsx` and `app/(auth)/layout.tsx` themselves | standalone, centred — there is no shell to render |
| `app/(auth)/error.tsx` | the login page | inside the split-screen auth layout |
| `app/global-error.tsx` | `app/layout.tsx` — the root itself | its own `<html>`/`<body>`, inline-styled |
| `app/(app)/not-found.tsx` | `notFound()` thrown inside the app — the product, tax-report and agent detail routes all call it | **inside** the app shell |
| `app/not-found.tsx` | a URL that matches no route at all | standalone — a route group's layout does not apply to the root not-found |

**`app/error.tsx` is the one that is easy to miss and matters most here.** A boundary
does *not* catch errors thrown by the layout at its own level, and
`app/(app)/layout.tsx` calls `getCurrentUser()` → `serverApi("/auth/me")` on every
single page load. So the most likely failure in this product — the backend being
unreachable, or the session having expired — throws in the app layout, which
`(app)/error.tsx` can never see. Without a root-level boundary the whole app falls
through to Next's default screen in exactly the case that matters most.

## Next 16 contract

Error boundaries are Client Components. Next 16 passes **`unstable_retry`** alongside
the older `reset`; the documented prop is `unstable_retry` and `reset` is still present
on the `ErrorInfo` type. Both are accepted and `unstable_retry` is preferred, so the
boundary is correct on this version and survives `reset` being dropped:

```ts
type ErrorBoundaryProps = {
  error: Error & { digest?: string };
  reset?: () => void;
  unstable_retry?: () => void;
};
```

`global-error.tsx` must render its own `<html>` and `<body>` — it replaces the root
layout, so no provider, no font class and **no stylesheet** is guaranteed. It is styled
inline for that reason, and only that file is (root Rule 9's token rule cannot apply to
a document that renders without the token sheet).

## What the user is told — and what we refuse to guess

In production Next strips a server error's message before it reaches the browser and
substitutes a `digest`. This is a security property, not a limitation to work around,
and the boundary is built to respect it:

- **A `digest` is shown as a support reference** when present. It is the only honest
  link between what the user saw and what the server logged.
- **A message is classified only when one actually survives.** Errors thrown in Client
  Components (`clientApi` calls) keep their message in production; server errors keep
  theirs in development. `classifyError` reads what is there and falls back to a plain
  "something went wrong" rather than inferring a cause it cannot see.
- **A stack trace is never rendered** (root Rule 6).

### The four classifications

| Kind | Recognised from | What the user is offered |
| --- | --- | --- |
| `session` | 401, `unauthorized`, `invalid_token`, "session" | Sign in again — a retry cannot fix an expired token |
| `offline` | `backend_unreachable`, "failed to fetch", "NetworkError", `ECONNREFUSED` | Try again — plus the fact that the data is fine, the connection is not |
| `missing` | 404, `not_found` | Back to the dashboard |
| `unknown` | anything else, including a bare digest | Try again, then back to the dashboard |

The distinction earning its place is `session`: offering "Try again" to someone whose
token expired loops them through the same failure forever, because the retry re-runs the
same unauthenticated fetch. That case needs `/login`, and only that case.

## Scope

### 1. `lib/error-boundary.ts` — all derived logic, unit-tested
The repo has no jsdom runner, so correctness lives in `lib/` where Vitest can reach it
and the components stay presentational:

- `classifyError(error)` → `{ kind, title, body, retryable, href?, hrefLabel? }`
- `supportReference(error)` → the digest, or `null`
- `isSessionExpired(error)` — the one branch with a different action

### 2. `components/shared/error-state.tsx`
One presentational component every boundary renders. Semantic tokens only, Lucide
outline icon, no motion (root Rule 9). Not brand red — a failure is `--destructive`;
`--brand` stays identity-only.

### 3. The five route files above.

## Non-goals

- **No error-reporting service.** Nothing in the product ships one today, and adding a
  vendor is a decision, not a detail. The boundary logs to `console.error` in an effect,
  which is where a reporter would later be called from.
- **No per-route custom copy.** A boundary that says "we could not load your returns"
  reads better and would need 21 files kept in sync with the routes; when one route
  earns its own boundary it can have one, and it will nest correctly under this.
- **`loading.tsx` is untouched.** This is the failure path, not the pending one.

## Acceptance criteria

1. A throw in any `(app)` route renders inside the shell, sidebar intact. — done
2. A throw in `app/(app)/layout.tsx` (backend down) renders the root boundary. — done
3. An expired session offers sign-in, not retry. — done
4. A `digest` is shown as a support reference; a stack trace never is. — done
5. `global-error.tsx` renders standalone with its own `<html>`/`<body>`. — done
6. An unknown URL renders `not-found.tsx` in the shell. — done
7. Both `unstable_retry` and `reset` are accepted. — done
8. All `lib/error-boundary.ts` logic is Vitest-covered. — done
9. `npm test`, `npx tsc --noEmit` and `npm run build` all pass. — done

## Manual verification (no jsdom runner — root Rule 4)

- [ ] Stop the backend, load `/dashboard` → root boundary, "can't reach", retry works
      once the backend is back.
- [ ] Clear the session cookie, load `/results` → sign-in action, not retry.
- [ ] Visit `/nonsense` → not-found inside the shell.
- [ ] Both themes correct on every boundary, `global-error` included.
- [ ] Keyboard: actions reachable and focus-visible.

## Patches

### 2026-09-10 — two faults found by running it, not by the tests

Both were invisible to a green suite and to a green build, and both were found by
loading the boundaries in the real app.

**1. The session branch could never fire, so the fix moved to the throw site.**

The most valuable classification — session expired → *Sign in*, not *Try again* — is
also the one that almost never reaches the boundary. Next strips a server error's
message in production, so a 401 thrown by `getCurrentUser()` in `(app)/layout.tsx`
arrives as a bare digest and classifies as `unknown`: "Something went wrong" with a
*Try again* that re-runs the same rejected request forever.

The boundary cannot fix this from the outside. `proxy.ts` already refreshes silently
when the access cookie is **absent** — but it gates on presence alone, so a cookie
that is still there while the backend rejects the token inside it (secret rotated,
token revoked, clock skew) sails through and 401s in the layout. That case now
redirects to `/login` from the layout instead of rendering an error page at all,
which is both the correct UX and the same destination the proxy would have chosen.

**2. That redirect looped, and only a browser showed it.**

`proxy.ts` ends with `if (hasSession && isAuthRoute) redirect("/")`. The rejected
cookie is still present, so `hasSession` is true: `/dashboard` → 401 → `/login` →
gate → `/dashboard` → `ERR_TOO_MANY_REDIRECTS`. A Server Component cannot clear a
cookie during render, so the layout redirects to `/login?session=expired` and the
gate clears both cookies when it sees that marker and lets the login page render.
Verified in a browser: the loop is gone and the request lands on `/login`.

**Verified live**, on the running app:

| case | HTTP | lands on | boundary |
| --- | --- | --- | --- |
| `/nonsense-route` | 404 | `/nonsense-route` | root not-found, standalone |
| `/products/999999999` | 200 | `/products/999999999` | `(app)` not-found, **in shell** |
| rejected token on `/dashboard` | 200 | `/login` | none — redirected, no loop |
| `/products/999999999` (dark) | 200 | `/products/999999999` | in shell, tokens correct |

Captured with `tools/capture_errors.mjs`; screenshots in
`ref/screens/errors-2026-09-10/`.

### Scope added by this patch

- `app/(app)/layout.tsx` — 401 from `getCurrentUser()` redirects rather than throws.
- `proxy.ts` — clears a rejected cookie pair when it sees `?session=expired`.
