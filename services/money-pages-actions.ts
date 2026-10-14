/**
 * Money pages writes (SPEC-308) — client-side, through the proxy.
 *
 * Two writes, both into our own database: draft a page, and record that the owner pasted
 * it into Shopify. **Nothing here changes the shop** — that is the owner's step, by
 * decision (backend SPEC-304 §The boundary). Callers invalidate `["money-pages"]`.
 */
import { proxyUrl } from "@/lib/client-api";
import { adaptMoneyPageDraft, type MoneyPageDraft } from "@/lib/money-pages";

async function fail(response: Response, fallback: string): Promise<Error> {
  const body = (await response.json().catch(() => null)) as
    | { error?: { message?: string } }
    | null;
  return new Error(body?.error?.message ?? `${fallback} (${response.status}).`);
}

/** Write the new title, meta description and page copy. Minutes, not seconds — the
 * caller shows progress rather than blocking the list. */
export async function writeMoneyPage(kind: string, pageId: number): Promise<MoneyPageDraft> {
  const response = await fetch(proxyUrl(`/money-pages/${kind}/${pageId}/draft`), {
    method: "POST",
  });
  if (!response.ok) throw await fail(response, "Writing the page failed");
  return adaptMoneyPageDraft((await response.json()) as Record<string, unknown>);
}

/** Record that this draft has been pasted into Shopify — a note, never an action on the
 * shop. Passing `false` undoes it. */
export async function markMoneyPageApplied(
  draftId: number,
  applied = true,
): Promise<MoneyPageDraft> {
  const response = await fetch(proxyUrl(`/money-pages/drafts/${draftId}/applied`), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ applied }),
  });
  if (!response.ok) throw await fail(response, "Saving failed");
  return adaptMoneyPageDraft((await response.json()) as Record<string, unknown>);
}
