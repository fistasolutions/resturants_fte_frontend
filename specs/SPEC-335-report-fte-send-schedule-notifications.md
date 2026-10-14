# SPEC-335 — Report FTE: send and schedule dialogs, the notification bell, scheduled reports on Daily Reports

**Status:** implemented 2026-10-02 · **Backend:** SPEC-343.

## 1. Approve & send → a dialog

The Composer's **Approve & send** opens a dialog:
- **Send to** — a recipient picker: chips for the chosen addresses (owner prefilled from
  `GET /report-fte/recipients` `default`), a dropdown of every address in the directory with
  its label (Owner, members, Shop managers, "Manager · <location>", Warehouse/Support/Returns)
  to tick, and a box to type any other address (Enter or comma adds it; an invalid address
  says so and is not added). Each chip removes with ×.
- The formats the report goes out with (PDF, Excel) as a line, and **Send report**
  (disabled until at least one valid address). On success the button reads
  "✓ Sent to N people" and the status line shows the backend's words; a failure stays in the
  dialog.
- A run made by a schedule prefills that schedule's recipients instead.

## 2. Approve & schedule → a dialog

- **How often**: Daily · Weekly · Monthly. **Day**: weekday (weekly) or day of month 1–28
  (monthly). **Time**: hour and minute, in the store's timezone (shown).
- **Send to**: the same picker.
- **When it runs**: *Send automatically* (you get a notification after it is sent) or
  *Ask me first* (a notification asks you to approve each one).
- **Also show on the Daily Reports page** (checkbox, on by default).
- **Save schedule**; the button then reads what was saved: "✓ Weekly · Mon 07:00 · 3 people".

Pure halves in `lib/report-fte-delivery.ts`: email validation, adding/removing addresses,
the default selection, the schedule body and the saved-schedule label. Unit-tested.

## 3. The notification bell

`components/layout/notifications-bell.tsx` in the sidebar header (and the phone header): a
bell with the unread count; a popover lists the newest notifications (title, body, time),
each a link to its `href` that marks it read; **Mark all read**. Reads
`lib/queries/notifications.ts` (`refetchInterval` 60 s); writes
`services/notifications-actions.ts`. Empty state: "No notifications yet."

## 4. Scheduled reports on Daily Reports

Under the period toggle, a **Scheduled reports** card for the active period (Daily /
Weekly / Monthly) lists the opted-in runs from `GET /report-fte/on-reports?cadence=` — title,
when it ran, who it went to — each opening `/report-fte/reports/<id>`. Hidden when there are
none.

## Docs (Rule 11)

`lib/docs/content/report-fte.ts` (the two dialogs, auto vs ask, notifications) and
`reports.ts` (the Scheduled reports card); the overview mentions the bell.

## Acceptance criteria

1. Send dialog prefilled with the owner, editable, lists every directory address, sends only
   to the chosen ones.
2. Schedule dialog saves cadence/day/time/recipients/mode/show-on-reports; the button shows
   the saved schedule, never a fixed "weekly".
3. The bell shows the unread count, lists notifications, links and marks them read.
4. Daily Reports shows opted-in scheduled reports for the active period.
5. `npm test`, `npx tsc --noEmit`, lint and `npm run build` pass; docs updated.

## Manual verification checklist

- [ ] Send dialog: owner prefilled; tick a manager; type an address; send; Delivered shows it.
- [ ] Schedule dialog: weekly Mon 07:00, two people, Ask me first, show on reports; button label.
- [ ] Bell: count, list, click marks read, Mark all read.
- [ ] Daily Reports → Weekly lists the scheduled report after its first run.
- [ ] Light and dark; 1440 and 400 px.
