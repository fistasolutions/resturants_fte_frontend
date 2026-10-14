"use client";

import Link from "next/link";
import { useState } from "react";
import { LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { goAfterSignIn } from "@/features/auth/after-sign-in";
import { CodeInput } from "@/features/auth/code-input";
import { FieldError } from "@/features/auth/field-error";
import { FormAlert } from "@/features/auth/form-alert";
import { PasswordInput } from "@/features/auth/password-input";
import { useResend } from "@/features/auth/use-resend";
import { CODE_LENGTH } from "@/lib/auth-flows";
import { resetPassword } from "@/services/auth";
import { validatePassword } from "@/utils/validation";

export function ResetForm({ email }: { email: string }) {
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const resend = useResend(email, "reset_password");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const invalid = validatePassword(password);
    setPasswordError(invalid);
    if (code.length !== CODE_LENGTH) {
      setError("Enter the 6-digit code from the email.");
      document.getElementById("reset-code")?.focus();
      return;
    }
    if (invalid) {
      document.getElementById("reset-password")?.focus();
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      goAfterSignIn(await resetPassword(email, code, password));
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Could not reset the password.");
      setIsSubmitting(false);
    }
  }

  if (!email) {
    return (
      <p className="text-sm text-muted-foreground">
        <Link href="/forgot" className="font-medium text-foreground underline-offset-4 hover:underline">
          Ask for a reset code
        </Link>{" "}
        first.
      </p>
    );
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit} noValidate>
      <div className="space-y-2">
        <Label htmlFor="reset-code">6-digit code</Label>
        <CodeInput id="reset-code" value={code} onChange={setCode} disabled={isSubmitting} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="reset-password">New password</Label>
        <PasswordInput
          id="reset-password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          value={password}
          onChange={(event) => {
            setPassword(event.target.value);
            if (passwordError) setPasswordError(null);
          }}
          aria-invalid={Boolean(passwordError)}
          aria-describedby={passwordError ? "reset-password-error" : undefined}
        />
        <FieldError id="reset-password-error" message={passwordError} />
      </div>
      <FormAlert message={error ?? resend.error} />
      <FormAlert message={resend.note} tone="note" />
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <LoaderCircle className="size-4 animate-spin" aria-hidden />
            Saving…
          </>
        ) : (
          "Set new password and sign in"
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
