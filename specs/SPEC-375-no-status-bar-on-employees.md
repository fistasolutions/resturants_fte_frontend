# SPEC-375 — No status bar on the employees; the kill switch moves to Settings

**Status:** Implemented 2026-10-14
**Repo:** ecommerce-fte-frontend (no backend change, no API change)
**Touches:** SPEC-345 (Email Marketing Manager), SPEC-346 (Customer Support Agent), SPEC-358
(actions follow the role), SPEC-229-in-app-docs.md (Rule 11)

## Request

Owner, 2026-10-14: "Remove that bar — I do not want it on any of the FTEs."

"That bar" is the status strip under the page header on two employees:

- Email Marketing Manager — `features/email-marketing/status-strip.tsx` (`StatusStrip`), drawn by
  `email-marketing-shell.tsx` on every tab.
- Customer Support Agent — `features/customer-support/status-strip.tsx` (`SupportStatusStrip`),
  drawn by `customer-support-shell.tsx` on every tab.

Each strip showed the connection (badge + account / last sync), the autonomy level, the report
age (email) or the replies waiting for approval (support), and the **kill switch** with its
paused notice. The email strip also showed the read-only / partial Klaviyo access banner
(`accessBanner`).

No other employee (Spotlight, Social Growth, Paid Ads Manager, Report FTE, Finance Oversight)
has such a strip under its header. The Paid Ads Manager's budget strip with its cap and kill
switch is a different control (SPEC-183) and is not touched by this spec.

## Decision

1. The strip is removed from both shells. The breadcrumb, header, tab bar and panel stay exactly
   as they are.
2. **The kill switch is not lost.** It is the one control that stops every send at once, so it
   moves to the **top of each employee's Settings tab** as a small card, built from the strip's
   own code (the file moves, it is not duplicated):
   - Email: `features/email-marketing/settings/kill-switch-card.tsx` (`KillSwitchCard`) — the
     same Kill switch / Release kill switch buttons, the same reason dialog (min 3 characters),
     the same paused notice. It reads the backend's `workspace.killSwitch` and moves only when the
     write succeeds, as before.
   - Support: `features/customer-support/settings/kill-switch-card.tsx` (`KillSwitchCard`) — the
     first Settings section, **Kill switch** (`?section=kill-switch`): stopping is still one
     click, releasing still asks first, the paused notice and the action feedback are the same.
3. What the strip held that Settings did not already show moves into Settings:
   - Email: the read-only / partial key banner (`accessBanner`, with Open Integrations) and the
     report age line ("Reports as of …" / "No report yet") join the **Connection** card, under the
     connected status. The connection badge, account and autonomy were already on Settings.
   - Support: connection state, last sync and autonomy are already on Settings (Connection and
     Autonomy sections). The "N replies wait for approval" link is not moved: the Overview's
     *Needs you* list and the Approvals tab already show it.
4. Rule 13 is kept exactly: the kill switch buttons stay `RoleButton`s with the strip's
   permissions — `email_marketing.manage` (email) and `team_performance.manage` (support), the
   same as `lib/action-permissions.ts` (`email-marketing-actions:setKillSwitch`,
   `customer-support-actions:setKillSwitch`). The registry is keyed by service function, so it
   does not change.
5. Copy that pointed at "the strip above" (the support Guardrails section summary, the shells'
   and layouts' comments) points at Settings → Kill switch.

**FOC after this change:** FOC sees the bar gone from both employees, at the owner's request;
the kill switch, autonomy and connection are on each employee's Settings tab. Nothing in FOC's
data, settings or kill-switch state changes.

## Acceptance criteria

1. `/email-marketing` and `/customer-support` draw no status strip under the header on any tab;
   the header, tabs and panel are unchanged.
2. Email Settings opens with a Kill switch card: Kill switch (destructive, disabled when not
   connected or a write is in flight) opens the reason dialog and pauses on confirm; when paused
   the card shows the paused notice and Release kill switch.
3. Support Settings' first section is Kill switch: one click stops; Release asks first; the
   paused notice and feedback show; `?section=kill-switch` scrolls to it.
4. Email Settings' Connection card shows the access banner (read-only / partial key) and the
   report age when connected.
5. Both kill switch buttons are `RoleButton`s with the same permission as before;
   `tests/role-gate-coverage.test.ts` stays green.
6. `status-strip.tsx` no longer exists in either feature; nothing imports it.
7. In-app docs (`lib/docs/content/email-marketing.ts`, `customer-support.ts`) describe the kill
   switch on Settings, not "on every tab"; `updated` is `2026-10-14`.
8. `npx tsc --noEmit`, `npm run lint`, `npm test`, `npm run build` green.

## Manual verification checklist (no component runner)

- Load `/email-marketing` and `/customer-support`: no bar between the header and the tabs; nothing
  animates in.
- Email → Settings: the Kill switch card is first; with Klaviyo not connected the Kill switch
  button is disabled; a role without Manage email marketing sees it disabled with the role's reason.
- Support → Settings: the section index lists Kill switch first; a role without
  `team_performance.manage` sees the button disabled with the reason.
- Both themes: the card and the paused notice use tokens only.

## Implementation

- Removed: `features/email-marketing/status-strip.tsx`, `features/customer-support/status-strip.tsx`
  (their code moved, not copied, into the two `settings/kill-switch-card.tsx` files below).
- `features/email-marketing/email-marketing-shell.tsx`, `features/customer-support/customer-support-shell.tsx`:
  the strip is no longer rendered; header, tabs and panel unchanged.
- `features/email-marketing/settings/kill-switch-card.tsx` (`KillSwitchCard`, a `SettingsPanel`
  with `id="kill-switch"`), first in `settings/settings-tab.tsx`.
- `features/email-marketing/settings/connection-card.tsx`: the access banner and the report age.
- `features/customer-support/settings/kill-switch-card.tsx` (`KillSwitchCard`), the first
  `SECTIONS` entry (`kill-switch`) in `settings/settings-tab.tsx`; the Guardrails summary now
  says the kill switch is at the top of Settings.
- `features/email-marketing/flows/flow-detail-view.tsx`: "The kill switch is on" now links to
  Settings.
- Comments in both `app/(app)/*/layout.tsx` no longer mention a strip.
- Docs: `lib/docs/content/email-marketing.ts` and `customer-support.ts` (`updated` 2026-10-14).

Not changed: the Paid Ads Manager's budget strip (SPEC-183) — a different control, outside the
request as scoped.

## Verification (2026-10-14)

| # | Criterion | Result |
|---|-----------|--------|
| 1 | No strip under the header on either employee | done — shells render breadcrumb, header, tabs, panel only |
| 2 | Email Settings opens with the Kill switch card, reason dialog, paused notice, Release | done |
| 3 | Support Settings' first section is Kill switch; one-click stop, Release asks; `?section=kill-switch` | done — the existing `?section=` scroll handles the new id |
| 4 | Email Connection card shows the access banner and the report age | done |
| 5 | Kill switch buttons are `RoleButton`s with the same permissions; role-gate coverage green | done — `email_marketing.manage` / `team_performance.manage`; `tests/role-gate-coverage.test.ts` passes |
| 6 | `status-strip.tsx` gone; nothing imports it | done — `grep -rn "status-strip\|StatusStrip"` finds nothing |
| 7 | In-app docs describe the kill switch on Settings; `updated` 2026-10-14 | done |
| 8 | tsc, lint, test, build green | done — `npx tsc --noEmit` exit 0; `npm run lint` 0 errors (3 pre-existing warnings in social/spotlight files); `npm test` 234 files, 2659 tests passed; `npm run build` compiled, 84/84 static pages |

Manual checklist (no component runner): not run in a browser in this change; the checklist above
stands for the owner's review.

## Patches

### 2026-10-14 — the kill switch is removed too

Owner: "Remove the kill switch, I do not want anything like that."

- **No button pauses an employee any more.** The kill switch card is gone from Email Marketing
  Manager's and Customer Support Agent's Settings. Autonomy (Suggest … Autopilot) is how much an
  employee does on its own.
- **A store that was already paused is not stranded.** It sees one `PausedNotice` line at the top
  of Settings with **Resume**, and nothing else. It shows only while the backend reports
  `killSwitch.active`.
- **Pre-send checks.** `guardrailChecks` (Email) and `guardrailCheck` (Support) no longer list a
  "Kill switch: Off" row. A paused employee gets one blocking row, "Paused", with the way to resume.
- **Wording.**
  - A flow's page and a topic card say "paused" where they said "kill switch".
  - Support's activity log names the event "Paused or resumed".
  - Support Settings loses its Kill switch section.
- **Docs.** Both employees' docs describe Autonomy and the Resume line instead of the switch.
- **Backend unchanged.** The switch's API and its effect on sends stay. Only the screens stopped
  offering it.
- **Not changed:** Paid Ads Manager's spend kill switch and monthly cap, until the owner decides.

**FOC after this patch:** no kill switch on either employee, at the owner's request. If FOC's
employees were paused, the Resume line shows.
