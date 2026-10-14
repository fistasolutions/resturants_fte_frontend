/**
 * Where Gorgias sends the browser back after the owner presses Allow (SPEC-372 over backend
 * SPEC-380) — the Klaviyo callback's twin.
 *
 * A Route Handler rather than a page: it renders nothing, and it runs on the server, so the
 * **authorisation code is exchanged server-side and no token ever reaches the browser**. This
 * URL is the redirect URL saved on the Gorgias app, byte for byte. Only `code` and `state` are
 * passed on; the subdomain the connect started on is held by the backend.
 *
 * It only ever redirects — to Gorgias's own page, Settings tab, carrying `?gorgias=connected` or
 * `?gorgias_error=<sentence>`; a denied consent says so plainly.
 */
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";

import { ApiError, apiErrorFromResponse } from "@/lib/api-error";
import {
  GORGIAS_ERROR_PARAM,
  GORGIAS_GENERIC_ERROR,
  GORGIAS_RESULT_PARAM,
  gorgiasCallbackStep,
  gorgiasErrorMessage,
  gorgiasReturnUrl,
} from "@/lib/gorgias-connect";
import { SESSION_COOKIE } from "@/lib/session";

const API_URL = process.env.API_URL ?? "http://localhost:8000";

function back(params: Record<string, string>): never {
  redirect(gorgiasReturnUrl(params));
}

async function exchange(body: { code: string; state: string }): Promise<void> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const response = await fetch(`${API_URL}/api/v1/settings/integrations/gorgias/oauth/exchange`, {
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
  const step = gorgiasCallbackStep({
    error: query.get("error"),
    code: query.get("code"),
    state: query.get("state"),
  });
  if (step.kind === "cancelled") back({ [GORGIAS_ERROR_PARAM]: step.message });
  if (step.kind === "failed") back({ [GORGIAS_ERROR_PARAM]: step.message });

  try {
    await exchange({ code: step.code, state: step.state });
  } catch (error) {
    // The backend's message is already owner-readable and never carries Gorgias's body.
    back({
      [GORGIAS_ERROR_PARAM]: error instanceof ApiError ? gorgiasErrorMessage(error.message) : GORGIAS_GENERIC_ERROR,
    });
  }
  back({ [GORGIAS_RESULT_PARAM]: "connected" });
}
