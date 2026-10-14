# SPEC-324 — Settings, redesigned: grouped tabs, one panel style, Billing, Security, Organization, Audit log

**Repo:** frontend · **Status:** implemented · **Date:** 2026-09-29
**Pairs with:** backend `SPEC-331-settings-account-billing-api.md`.
**Builds on:**

- SPEC-097 and SPEC-232: the persistent shell.
- SPEC-230: the client cache.
- SPEC-234: the manager-email deep link.
- SPEC-316 and SPEC-317: team, roles and access.
- SPEC-318 and SPEC-322: branding.

## Owner's instructions (2026-09-29)

The owner approved the clickable mockup, then set the terms for building it:

1. A skeleton on every tab.
2. A tab bar, not a sidebar.
3. Full page width.
4. Professional throughout.
5. The first client's settings are not disturbed.
6. Custom dropdowns, never the browser's.
7. Components that never break.
8. A member sees only the tabs their role allows.
9. The manager-notifications deep link keeps its URL contract.
10. Settings is cached like every other page.
11. No two-step sign-in, no data export, no delete organization.

## Behaviour

### Navigation: two rows, both full width

- **Row 1** is a group switch: **Store · Organization · Account**. Each group links to its first tab
  the member may open.
- **Row 2** shows the tabs of the active group, as underlined links with the existing badges
  (automatic sending On/Off, manager emails `n/m`).
- Every tab is a real route, so a refresh or a shared link lands on the same tab.

| Group | Tab | Route | Shown to |
| --- | --- | --- | --- |
| Store | General | `/settings` | `settings.view` |
| Store | Daily report | `/settings/daily-report` | `settings.view` |
| Store | Automatic sending | `/settings/automatic-sending` | `settings.view` |
| Store | Manager notifications | `/settings/manager-notifications` | `settings.view` |
| Store | Watching | `/settings/watching` | every member |
| Organization | General | `/settings/organization` | `settings.view` |
| Organization | Team | `/settings/team` | `team.view` |
| Organization | Roles | `/settings/roles` | `team.view` |
| Organization | Branding | `/settings/branding` | `settings.view` |
| Organization | Billing & plan | `/settings/billing` | `billing.view` |
| Organization | Audit log | `/settings/audit` | `audit.view` |
| Account | Profile | `/settings/profile` | every member |
| Account | Security | `/settings/security` | every member |

- Holding `x.manage` counts as holding `x.view`.
- The owner (`*`) sees everything.
- A member on a tab their role cannot open is sent (`router.replace`) to their first visible tab.
  Profile is always visible, so this can never loop. The backend still refuses the data (SPEC-317).
- Every existing URL keeps working.
- The manager-email deep link is unchanged: `/settings/manager-notifications?focus=<target>&return=<path>`
  still scrolls to, focuses and rings the named row, and a save returns to `return`.

### One panel style (`features/settings/settings-panel.tsx`)

- **`SettingsPanel`:** a card with a title, a description, an optional action, stacked
  `SettingRow`s and an optional footer. The footer holds a hint on the left and the save button with
  its status on the right.
- **`SettingRow`:** the label and explanation on the left, the control on the right, stacked on
  phones.
- Every rebuilt card uses them. The recipient cards keep their per-row save, deep-link focus ring and
  return link.

### Custom controls

- `TimeSelect` (`features/settings/time-select.tsx`) replaces the browser time input. It is the
  design-system Select (Radix) with 15-minute steps in 12-hour labels, and it always includes the
  saved value, so a stored `06:50` is never rewritten.
- The Team invite and change-role dialogs and the watch dialog already used the design-system Select.
  The role editor's permission grid used the browser's checkbox; it now uses the design-system
  `Checkbox` (`components/ui/checkbox.tsx`, Radix, with the indeterminate state for an area).
- Switches, buttons, inputs and dialogs are all the existing shadcn components.

### Skeletons

- Each tab has `loading.tsx` with its own shape (`features/settings/settings-skeletons.tsx`), and the
  tab's view shows the same skeleton while its query is pending. There is no generic grey block.

### Cache

- Every read is a `QueryDef`, prefetched by its page without awaiting, and read with `useApiQuery`
  (SPEC-230). A tab revisited within a minute renders from the cache.
- New registries:
  - `lib/queries/account.ts`: `accountQueries.sessions()`.
  - `lib/queries/billing.ts`: `subscription()`, `invoices()`, `allowance()`, `plans()`.
  - `lib/queries/organization.ts`: `organizationQueries.settings()`.

### Tabs

- **Store → General:** store connection and system status. Profile and sign-out moved to Account.
- **Store → Daily report:** the report time (`TimeSelect`) and the next run.
- **Store → Automatic sending:**
  - Brief auto-send: switch and time.
  - Monday report card: switch.
  - Finance card: switch.
- **Store → Manager notifications:**
  - Shop managers: one row per location.
  - Teams: warehouse, support and returns.
- **Store → Watching:** unchanged view.
- **Organization → General:**
  - Name (saved through backend SPEC-331).
  - The team login link (read-only, copy).
  - Calendar, as a custom Select: none or Hebrew, the existing setting.
  - The plan, linking to Billing.
- **Organization → Team:** members and invitations. The activity log moved to its own tab, and Team
  links to it for members who have `audit.view`.
- **Organization → Roles** and **Organization → Branding:** unchanged views in the new shell.
- **Organization → Billing & plan:**
  - The plan (name, price, band, renewal), or "No plan yet".
  - **Change plan:** a dialog of the plans.
    - With Stripe, it starts Checkout with `return_to: "settings"`.
    - On return, `?session_id=` is confirmed once and the query is removed.
    - Without Stripe, it chooses directly.
  - **AI allowance:** a used/remaining meter and the reset date. Unmetered organizations read
    "Included".
  - **Payment:**
    - "Manage in Stripe" opens the customer portal.
    - Without a Stripe plan the button explains why.
  - **Invoices:** a table of date, number, description, amount and status, with each invoice's
    Stripe link. An empty state when there are none.
  - Change plan and payment are shown only with `billing.manage`.
- **Organization → Audit log:** the paged activity log (SPEC-316) as a full-width list.
- **Account → Profile:** the name (now really saved), email and photo initials.
- **Account → Security:**
  - Password: a change dialog. An account made with Google or Shopify sets one instead.
  - Where you're signed in: device, browser/OS, last active, this-device badge, "Sign out" per row
    and "Sign out all other sessions".
  - Sign out of this device.

### The first client's settings

Nothing is migrated or rewritten. Every value is read from and saved to the same endpoints. Times keep
their exact saved minute, and Hebrew-calendar organizations keep their calendar.

## Tests

- `tests/settings-nav.test.ts`:
  - groups and tabs;
  - `tabForPath` for every route, including the deep link with its query;
  - visibility per role (owner, admin, manager, social media manager, viewer);
  - `manage` implies `view`;
  - `firstVisibleTab`, and "every member keeps Profile".
- `tests/time-options.test.ts`: 15-minute steps, a saved off-step time kept, labels.
- `tests/billing-settings.test.ts`: subscription, invoice and allowance adapters; the meter percentage
  clamped; status tones; the portal error wording.
- `tests/account-sessions.test.ts`: the session adapter and ordering (current first).
- `tests/query-registries.test.ts`: the new registries pinned.
- Full `npm test`, `npx tsc --noEmit`, `npm run lint`, `npm run build`.

## Manual verification

- **As the owner:** all three groups and every tab. Switch groups and tabs; each shows its skeleton,
  and a revisit is instant.
- **As a Social Media Manager:** only Store → Watching and the Account tabs. `/settings` sends them to
  their first tab.
- **The deep link:** from the Brief, "Open Settings" on a missing manager email lands on the ringed
  row; a save returns to the Brief.
- **Controls:** every dropdown is the custom one, and times keep their minute.
- **Account:** Profile rename persists after a reload; Security lists this device, and signing
  another out works.
- **Billing:** the plan, allowance and invoices render; "Manage in Stripe" opens the portal (test
  keys).
- Light and dark themes; a phone-width window (tabs scroll, rows stack).

## Acceptance criteria

- [x] Grouped two-row tab bar, full width, role-aware.
- [x] A skeleton per tab; cached revisits.
- [x] One panel style; custom dropdowns and time selects; no native select or time input left in
  Settings.
- [x] Billing, Organization, Audit log, Profile (real save) and Security tabs.
- [x] Existing URLs and the manager-email deep link unchanged; saved values untouched.
- [x] Tests, type-check, lint and build green.

## Verification (2026-09-29)

- `npm test`: **2,177 passed** (194 files). New: `settings-nav`, `time-options`, `billing-settings`,
  `account-settings`; `query-registries` pins `account`, `billing` and `organization`.
- `npx tsc --noEmit` clean. `npm run lint`: 0 errors (3 old warnings in unrelated files).
- `npm run build`: all 13 Settings routes compile (`/settings`, `/settings/{daily-report,
  automatic-sending,manager-notifications,watching,organization,team,roles,branding,billing,audit,
  profile,security}`).
- The manual checklist above was not run against a live backend in this session. The local backend's
  database is the first client's production database, which is never used for development. It is
  for the owner's first look after deploy.

## Patches

- **2026-09-29, owner review of Roles:**
  - On a wide screen the role list is sticky (`lg:sticky lg:top-4`) while the permission grid scrolls.
  - A list taller than the window scrolls within itself.
  - Phones keep the horizontal role strip.
- 2026-10-14 (robustness, quick fix): the Billing page no longer **server-prefetches** the
  invoices query. Invoices come from Stripe; when Stripe is unreachable the server-started query
  rejected after hydration ("a query that was dehydrated as pending ended up rejecting"), throwing
  on the whole page. It now loads client-side only, where `InvoicesPanel` already shows
  "Reading your invoices…", then the list, "No invoices yet", or "Stripe could not be reached ·
  Try again". The other three reads (plans, subscription, allowance) are still prefetched. No
  other behaviour changes.
