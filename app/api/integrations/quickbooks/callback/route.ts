/**
 * Where Intuit sends the browser back (SPEC-299).
 *
 * A Route Handler rather than a page, for two reasons: it renders nothing, so there is
 * no flash of an empty screen while the code is exchanged, and it runs on the server, so
 * the **authorisation code is exchanged server-side and no token ever reaches the
 * browser**. This URL is the redirect URI saved on the Intuit app, byte for byte.
 *
 * It only ever redirects — to the page the connect started on (Integrations or Finance
 * Oversight, from the `qbo_return` cookie, allowlisted — SPEC-303), carrying either the
 * company that was connected or a sentence the owner can act on. A cancelled connect is
 * not an error.
 *
 * The POST is built here rather than through `lib/api.ts`, whose `serverApi` is a GET;
 * widening the shared helper for one caller would put a write path in front of every
 * read in the app.
 */
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";

import { ApiError, apiErrorFromResponse } from "@/lib/api-error";
import { RETURN_COOKIE, returnPathFor } from "@/lib/quickbooks-connection";
import { SESSION_COOKIE } from "@/lib/session";

const GENERIC = "QuickBooks could not complete that connection. Try connecting again.";
const API_URL = process.env.API_URL ?? "http://localhost:8000";

interface CallbackResponse {
  connection: { company_name: string };
  syncing: boolean;
}

function back(root: string, params: Record<string, string>): never {
  const query = new URLSearchParams(params).toString();
  redirect(query ? `${root}?${query}` : root);
}

async function completeConnection(body: {
  code: string;
  realm_id: string;
  state: string;
}): Promise<CallbackResponse> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const response = await fetch(`${API_URL}/api/v1/finance/callback`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!response.ok) throw await apiErrorFromResponse(response);
  return (await response.json()) as CallbackResponse;
}

export async function GET(request: NextRequest): Promise<never> {
  const query = request.nextUrl.searchParams;
  // Where the connect started — read once, then forgotten, whatever happens next.
  const jar = await cookies();
  const root = returnPathFor(jar.get(RETURN_COOKIE)?.value);
  jar.delete(RETURN_COOKIE);

  // The owner pressed Cancel at Intuit. Nothing failed, so nothing red.
  if (query.get("error")) back(root, { qbo_cancelled: "1" });

  const code = query.get("code");
  const realmId = query.get("realmId");
  const state = query.get("state");
  if (!code || !realmId || !state) back(root, { qbo_error: GENERIC });

  let company = "";
  try {
    const result = await completeConnection({ code, realm_id: realmId, state });
    company = result.connection.company_name;
  } catch (error) {
    // The backend's message is already owner-readable and never carries Intuit's body.
    back(root, { qbo_error: error instanceof ApiError ? error.message : GENERIC });
  }
  back(root, company ? { connected: company } : {});
}
