/**
 * Turn a page or a tab on or off for the company (SPEC-360 over backend SPEC-368) — client-side,
 * through the proxy. The caller refreshes the layout afterwards, so the sidebar, the tab bars and
 * the setup checklist follow.
 */
import { proxyUrl } from "@/lib/client-api";

export class PageSwitchError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "PageSwitchError";
  }
}

/** `unit` is a page key (`traffic`) or `<page>:<tab>` (`products:fit`). */
export async function setPageEnabled(unit: string, enabled: boolean): Promise<void> {
  const response = await fetch(proxyUrl(`/workspace/pages/${encodeURIComponent(unit)}`), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ enabled }),
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: { message?: string } } | null;
    throw new PageSwitchError(body?.error?.message ?? `Couldn't change the page (${response.status}).`, response.status);
  }
}
