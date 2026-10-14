"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { goAfterSignIn } from "@/features/auth/after-sign-in";
import { AuthDivider } from "@/features/auth/auth-divider";
import { FieldError } from "@/features/auth/field-error";
import { FormAlert } from "@/features/auth/form-alert";
import { PasswordInput } from "@/features/auth/password-input";
import { ProviderButtons } from "@/features/auth/provider-buttons";
import { SIGN_IN_PROVIDERS } from "@/lib/auth-providers";
import { stepForError } from "@/lib/auth-flows";
import { AuthFlowError, login } from "@/services/auth";
import { validateEmail } from "@/utils/validation";

interface LoginErrors {
  email: string | null;
  password: string | null;
}

export function LoginForm({ next }: { next?: string | null }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<LoginErrors>({ email: null, password: null });
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: LoginErrors = {
      email: validateEmail(email),
      password: password ? null : "Password is required.",
    };
    setErrors(nextErrors);
    const firstInvalid = nextErrors.email ? "login-email" : nextErrors.password ? "login-password" : null;
    if (firstInvalid) {
      document.getElementById(firstInvalid)?.focus();
      return;
    }
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      goAfterSignIn(await login({ email, password }), next);
    } catch (failure) {
      const code = failure instanceof AuthFlowError ? failure.code : undefined;
      if (stepForError(code) === "verify") {
        // The backend has just emailed a fresh code.
        router.push(`/verify?email=${encodeURIComponent(email.trim().toLowerCase())}`);
        return;
      }
      setSubmitError(failure instanceof Error ? failure.message : "Could not sign you in.");
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* SPEC-340: Google on by default, Shopify off — see lib/auth-providers.ts. */}
      {SIGN_IN_PROVIDERS.any ? (
        <>
          <ProviderButtons next={next} providers={SIGN_IN_PROVIDERS} />
          <AuthDivider />
        </>
      ) : null}
      <form className="space-y-4" onSubmit={handleSubmit} noValidate>
        <div className="space-y-2">
          <Label htmlFor="login-email">Email</Label>
          <Input
            id="login-email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              if (errors.email) setErrors((e) => ({ ...e, email: null }));
            }}
            onBlur={() => setErrors((e) => ({ ...e, email: email ? validateEmail(email) : null }))}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "login-email-error" : undefined}
          />
          <FieldError id="login-email-error" message={errors.email} />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="login-password">Password</Label>
            <Link
              href="/forgot"
              className="rounded-sm text-xs text-muted-foreground underline-offset-4 outline-none hover:text-foreground hover:underline focus-visible:ring-2 focus-visible:ring-ring"
            >
              Forgot password?
            </Link>
          </div>
          <PasswordInput
            id="login-password"
            autoComplete="current-password"
            placeholder="Your password"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              if (errors.password) setErrors((e) => ({ ...e, password: null }));
            }}
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? "login-password-error" : undefined}
          />
          <FieldError id="login-password-error" message={errors.password} />
        </div>

        <FormAlert message={submitError} />

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <LoaderCircle className="size-4 animate-spin" aria-hidden />
              Signing in…
            </>
          ) : (
            "Sign in"
          )}
        </Button>
      </form>
      <p className="text-center text-sm text-muted-foreground">
        New here?{" "}
        <Link
          href="/signup"
          className="rounded-sm font-medium text-foreground underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
        >
          Create an account
        </Link>
      </p>
    </div>
  );
}
