"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError } from "@/features/auth/field-error";
import { FormAlert } from "@/features/auth/form-alert";
import { forgotPassword } from "@/services/auth";
import { validateEmail } from "@/utils/validation";

export function ForgotForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const invalid = validateEmail(email);
    setFieldError(invalid);
    if (invalid) {
      document.getElementById("forgot-email")?.focus();
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      await forgotPassword(email.trim().toLowerCase());
      router.push(`/reset?email=${encodeURIComponent(email.trim().toLowerCase())}`);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Could not send the code.");
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit} noValidate>
      <div className="space-y-2">
        <Label htmlFor="forgot-email">Email</Label>
        <Input
          id="forgot-email"
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            if (fieldError) setFieldError(null);
          }}
          aria-invalid={Boolean(fieldError)}
          aria-describedby={fieldError ? "forgot-email-error" : undefined}
        />
        <FieldError id="forgot-email-error" message={fieldError} />
      </div>
      <FormAlert message={error} />
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <LoaderCircle className="size-4 animate-spin" aria-hidden />
            Sending…
          </>
        ) : (
          "Send me a code"
        )}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        <Link href="/login" className="font-medium text-foreground underline-offset-4 hover:underline">
          Back to sign in
        </Link>
      </p>
    </form>
  );
}
