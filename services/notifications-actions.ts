/**
 * Notification writes (SPEC-335 / backend SPEC-343) — through the proxy. Callers
 * invalidate `["notifications"]` afterwards.
 */
import { proxyUrl } from "@/lib/client-api";

async function post(path: string, fallback: string): Promise<void> {
  const response = await fetch(proxyUrl(path), { method: "POST" });
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: { message?: string } } | null;
    throw new Error(body?.error?.message ?? `${fallback} (${response.status}).`);
  }
}

export async function markNotificationRead(id: number): Promise<void> {
  await post(`/notifications/${id}/read`, "Marking the notification read failed");
}

export async function markAllNotificationsRead(): Promise<void> {
  await post("/notifications/read-all", "Marking the notifications read failed");
}
