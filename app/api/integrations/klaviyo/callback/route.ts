/**
 * Where Klaviyo sends the browser back after the owner presses Allow (SPEC-371 over backend
 * SPEC-379). The QuickBooks pattern (SPEC-299).
 *
 * A Route Handler rather than a page: it renders nothing, so there is no flash of an empty
 * screen while the code is exchanged, and it runs on the server, so the **authorisation code
 * is exchanged server-side and no token ever reaches the browser**. This URL is the redirect
 * URI saved on the Klaviyo app, byte for byte. The PKCE verifier never leaves the backend
 * either: only `code` and `state` are passed on.
 *
 * It only ever redirects — to the page the connect started on (the Integrations hub or Email
 * Marketing → Settings, from the allowlisted `klaviyo_return` cookie), carrying
 * `?klaviyo=connected` or `?klaviyo_error=<sentence>`; a denied consent says so plainly.
 *
 * The POST is built here rather than through `lib/api.ts`, whose `serverApi` is a GET.
 */
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";

import { ApiError, apiErrorFromResponse } from "@/lib/api-error";
import {
  KLAVIYO_ERROR_PARAM,
  KLAVIYO_GENERIC_ERROR,
  KLAVIYO_RESULT_PARAM,
  KLAVIYO_RETURN_COOKIE,
  klaviyoCallbackStep,
  klaviyoErrorMessage,
  klaviyoReturnPath,
  klaviyoReturnUrl,
} from "@/lib/klaviyo-connect";
import { SESSION_COOKIE } from "@/lib/session";

const API_URL = process.env.API_URL ?? "http://localhost:8000";

function back(root: string, params: Record<string, string>): never {
  redirect(klaviyoReturnUrl(root, params));
}

async function exchange(body: { code: string; state: string }): Promise<void> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const response = await fetch(`${API_URL}/api/v1/settings/integrations/klaviyo/oauth/exchange`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!response.ok) throw await apiErrorFromResponse(response);
}

export async function GET(request: NextRequest): Promise<never> {
  const query = request.nextUrl.searchParams;
  // Where the connect started — read once, then forgotten, whatever happens next.
  const jar = await cookies();
  const root = klaviyoReturnPath(jar.get(KLAVIYO_RETURN_COOKIE)?.value);
  jar.delete(KLAVIYO_RETURN_COOKIE);

  const step = klaviyoCallbackStep({
    error: query.get("error"),
    code: query.get("code"),
    state: query.get("state"),
  });
  if (step.kind === "cancelled") back(root, { [KLAVIYO_ERROR_PARAM]: step.message });
  if (step.kind === "failed") back(root, { [KLAVIYO_ERROR_PARAM]: step.message });

  try {
    await exchange({ code: step.code, state: step.state });
  } catch (error) {
    // The backend's message is already owner-readable and never carries Klaviyo's body.
    back(root, {
      [KLAVIYO_ERROR_PARAM]: error instanceof ApiError ? klaviyoErrorMessage(error.message) : KLAVIYO_GENERIC_ERROR,
    });
  }
  back(root, { [KLAVIYO_RESULT_PARAM]: "connected" });
}
