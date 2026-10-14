# SPEC-347 — Customer Support and Email Marketing: no accidental sends from the keyboard or a double click

**Status:** implemented 2026-10-07 · **Repo:** frontend (backend SPEC-356 is the server half) ·
**Fixes:** SPEC-345-email-marketing-manager.md, SPEC-346-customer-support-agent.md

## Why

A review of the overnight commits `81cacef`/`149a9e2` (2026-10-07) found sends that reach real
customers with no deliberate act. Owner: "first pull the latest merge and then fix".

## What changes

### 1. Support Approvals: `a` asks before it sends

In `features/customer-support/approvals/approvals-tab.tsx`, `a` now opens a confirm dialog,
"Send this reply to <customer>?", showing the reply. The reply is sent only from the dialog's
**Send reply** button. `a` and `r` work only when all of these hold:

- the owner chose a card (with j/k or a click), so there is no fallback to the first card;
- the key is not being held down (`event.repeat`);
- no write is in flight;
- no dialog is open.

*Was:* `a` sent the first card's reply at once, even inside the Send-back dialog, and twice on a
double press.

### 2. One write at a time

`useSupportActions` and `useEmailMarketingActions` ignore a write while another is in flight. A
ref guards this, not the `busy` state, which only updates after a render, so two clicks or two
key presses in the same frame cannot both go through.

### 3. Email Approvals: turning a flow on asks first

In `features/email-marketing/approvals/approvals-tab.tsx`, approving a **Turn on a flow** card,
by button or by `a`, opens "Turn on <flow>?". The dialog says the flow starts emailing every
customer who meets its trigger. `a` also respects the in-flight write and the kill switch, as
the button already did.

### 4. The safety items that cannot be switched off are shown that way

In the support Settings guardrails card, the five sensitive flags and the Wholesale topic are
shown ticked and disabled, with the label "always handled by a person". The server enforces this
(SPEC-356 §1). `lib/customer-support.ts` adds `ALWAYS_NEVER_AUTO_TOPICS` and `withMandatory()`,
mirroring the backend.

### 5. Docs (Rule 11)

- `customer-support`: the agent starts at **Suggest** (SPEC-356 §6); `a` asks before sending;
  the guardrails that cannot be switched off.
- `email-marketing`: turning a flow on asks first; a flow the employee built cannot be turned on
  until its email is written in Klaviyo.

## Acceptance criteria

1. In support Approvals, `a` with no card chosen does nothing. With a card chosen it opens the
   confirm dialog, which sends exactly one reply. Holding `a`, or pressing it inside a dialog,
   sends nothing.
2. Clicking Approve twice quickly sends one request (both actions hooks).
3. Turning a flow on from email Approvals always asks first; `a` does nothing while a write is
   in flight or the kill switch is on.
4. The sensitive flags and Wholesale show ticked and cannot be unticked.
5. `npm test`, `npx tsc --noEmit`, lint on touched files and `npm run build` are green.

## Manual verification checklist

- Support → Approvals: press `a` before choosing a card, and nothing happens. Choose a card with
  `j`, press `a`, and the dialog opens. Cancel sends nothing; Send reply sends once.
- Open Send back, then press `a` inside the dialog: nothing is sent.
- Email → Approvals: a "Turn on a flow" card's button and `a` both open the confirm dialog.
- Support → Settings → Guardrails: the five flags and Wholesale are ticked and disabled.
