"use client";

import Link from "next/link";
import { useState } from "react";
import { LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { goAfterSignIn } from "@/features/auth/after-sign-in";
import { CodeInput } from "@/features/auth/code-input";
import { FormAlert } from "@/features/auth/form-alert";
import { useResend } from "@/features/auth/use-resend";
import { CODE_LENGTH } from "@/lib/auth-flows";
import { verifyEmail } from "@/services/auth";

export function VerifyForm({ email }: { email: string }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const resend = useResend(email, "verify_email");

  async function submit(value: string) {
    if (value.length !== CODE_LENGTH || isSubmitting) return;
    setIsSubmitting(true);
    setError(null);
    try {
      goAfterSignIn(await verifyEmail(email, value));
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "That code did not work.");
      setCode("");
      setIsSubmitting(false);
      document.getElementById("verify-code")?.focus();
    }
  }

  if (!email) {
    return (
      <p className="text-sm text-muted-foreground">
        Open the link from your sign-up, or{" "}
        <Link href="/signup" className="font-medium text-foreground underline-offset-4 hover:underline">
          start again
        </Link>
        .
      </p>
    );
  }

  return (
    <form
      className="space-y-4"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        void submit(code);
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="verify-code">6-digit code</Label>
        <CodeInput
          id="verify-code"
          value={code}
          onChange={setCode}
          onComplete={(value) => void submit(value)}
          disabled={isSubmitting}
        />
      </div>
      <FormAlert message={error ?? resend.error} />
      <FormAlert message={resend.note} tone="note" />
      <Button type="submit" className="w-full" disabled={isSubmitting || code.length !== CODE_LENGTH}>
        {isSubmitting ? (
          <>
            <LoaderCircle className="size-4 animate-spin" aria-hidden />
            Checking…
          </>
        ) : (
          "Continue"
        )}
      </Button>
      <Button
        type="button"
        variant="ghost"
        className="w-full"
        disabled={resend.wait > 0}
        onClick={() => void resend.resend()}
      >
        {resend.wait > 0 ? `Resend code in ${resend.wait}s` : "Resend code"}
      </Button>
    </form>
  );
}
