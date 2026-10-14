"use client";

import { useEffect, useState } from "react";

import { resendWait } from "@/lib/auth-flows";
import { resendCode } from "@/services/auth";

/** "Resend code" with the backend's 60-second cooldown shown as a countdown. The page
 * opens right after a code was sent, so the cooldown starts running at once. */
export function useResend(email: string, purpose: "verify_email" | "reset_password") {
  const [lastSentAt, setLastSentAt] = useState<number | null>(() => Date.now());
  const [now, setNow] = useState(() => Date.now());
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const wait = resendWait(lastSentAt, now);

  useEffect(() => {
    if (wait <= 0) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [wait]);

  async function resend() {
    if (wait > 0 || !email) return;
    setError(null);
    try {
      await resendCode(email, purpose);
      setLastSentAt(Date.now());
      setNow(Date.now());
      setNote("A new code is on its way.");
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Could not send a new code.");
    }
  }

  return { wait, resend, note, error };
}
