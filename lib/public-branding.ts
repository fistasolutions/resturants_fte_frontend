import "server-only";

import { headers } from "next/headers";

import { LOGIN_ORG_HEADER, validSlug } from "@/lib/auth-flows";
import { loginMedia, type LoginMedia, type PublicBranding } from "@/lib/login-media";

const API_URL = process.env.API_URL ?? "http://localhost:8000";

/** The login screen of the organization this visit's `/login?org=<slug>` names (SPEC-312,
 * SPEC-339: never a remembered one) — one public read (backend SPEC-318); no slug or any failure
 * is the platform's own screen. */
export async function linkedLoginMedia(): Promise<LoginMedia | null> {
  const slug = validSlug((await headers()).get(LOGIN_ORG_HEADER));
  if (!slug) return null;
  try {
    const response = await fetch(`${API_URL}/api/v1/branding/${slug}`, {
      next: { revalidate: 300 },
    });
    if (!response.ok) return null;
    return loginMedia((await response.json()) as PublicBranding);
  } catch {
    return null;
  }
}
