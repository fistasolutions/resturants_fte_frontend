/**
 * API access helpers (SPEC-017).
 * - serverApi: for Server Components/route handlers — talks to the backend
 *   origin directly with the httpOnly cookie token (no extra proxy hop).
 * - clientApi: for "use client" code — always goes through /api/proxy. Lives in
 *   `lib/client-api.ts` (SPEC-230) because this module is `server-only`.
 */
import "server-only";

import { cookies } from "next/headers";

import { apiErrorFromResponse } from "@/lib/api-error";
import { SESSION_COOKIE } from "@/lib/session";

export { ApiError } from "@/lib/api-error";

const API_URL = process.env.API_URL ?? "http://localhost:8000";

export async function serverApi<T>(path: string): Promise<T> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const response = await fetch(`${API_URL}/api/v1${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    cache: "no-store",
  });
  if (!response.ok) {
    throw await apiErrorFromResponse(response);
  }
  return (await response.json()) as T;
}
