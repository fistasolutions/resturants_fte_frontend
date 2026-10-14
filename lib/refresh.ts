/**
 * Silent session refresh (SPEC-149). Server-side only helper that trades a valid
 * refresh token for a fresh access/refresh pair via the backend rotate endpoint.
 *
 * Deliberately free of `next/headers` so it can run in both the Edge middleware
 * (`proxy.ts`) and route handlers, and be unit-tested in the Vitest node env.
 */
const API_URL = process.env.API_URL ?? "http://localhost:8000";

export interface RefreshedTokens {
  accessToken: string;
  refreshToken: string;
}

export async function refreshTokens(
  refreshToken: string,
): Promise<RefreshedTokens | null> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}/api/v1/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
      cache: "no-store",
    });
  } catch {
    return null;
  }
  if (!response.ok) return null;
  const data = (await response.json().catch(() => null)) as
    | { access_token?: string; refresh_token?: string }
    | null;
  if (!data?.access_token || !data?.refresh_token) return null;
  return { accessToken: data.access_token, refreshToken: data.refresh_token };
}
