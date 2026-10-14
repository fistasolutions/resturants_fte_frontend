"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthDivider } from "@/features/auth/auth-divider";
import { FieldError } from "@/features/auth/field-error";
import { FormAlert } from "@/features/auth/form-alert";
import { PasswordInput } from "@/features/auth/password-input";
import { ProviderButtons } from "@/features/auth/provider-buttons";
import { SIGN_IN_PROVIDERS } from "@/lib/auth-providers";
import { register } from "@/services/auth";
import { validateEmail, validateName, validatePassword } from "@/utils/validation";

interface SignupErrors {
  name: string | null;
  email: string | null;
  password: string | null;
}

/** `plan` (SPEC-320): the plan chosen on /pricing, kept in the URL into verify. */
export function SignupForm({ plan = null }: { plan?: string | null }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<SignupErrors>({ name: null, email: null, password: null });
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: SignupErrors = {
      name: validateName(name),
      email: validateEmail(email),
      password: validatePassword(password),
    };
    setErrors(nextErrors);
    const firstInvalid = (["name", "email", "password"] as const).find((f) => nextErrors[f]);
    if (firstInvalid) {
      document.getElementById(`signup-${firstInvalid}`)?.focus();
      return;
    }
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await register({ name, email, password });
      const verify = `/verify?email=${encodeURIComponent(email.trim().toLowerCase())}`;
      router.push(plan ? `${verify}&plan=${encodeURIComponent(plan)}` : verify);
    } catch (failure) {
      setSubmitError(failure instanceof Error ? failure.message : "Could not create the account.");
      setIsSubmitting(false);
    }
  }

  function field(key: keyof SignupErrors) {
    return {
      "aria-invalid": Boolean(errors[key]),
      "aria-describedby": errors[key] ? `signup-${key}-error` : undefined,
    };
  }

  return (
    <div className="space-y-6">
      {/* SPEC-340: Google on by default, Shopify off — see lib/auth-providers.ts. */}
      {SIGN_IN_PROVIDERS.any ? (
        <>
          <ProviderButtons providers={SIGN_IN_PROVIDERS} />
          <AuthDivider />
        </>
      ) : null}
      <form className="space-y-4" onSubmit={handleSubmit} noValidate>
        <div className="space-y-2">
          <Label htmlFor="signup-name">Your name</Label>
          <Input
            id="signup-name"
            autoComplete="name"
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              if (errors.name) setErrors((e) => ({ ...e, name: null }));
            }}
            {...field("name")}
          />
          <FieldError id="signup-name-error" message={errors.name} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="signup-email">Work email</Label>
          <Input
            id="signup-email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              if (errors.email) setErrors((e) => ({ ...e, email: null }));
            }}
            {...field("email")}
          />
          <FieldError id="signup-email-error" message={errors.email} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="signup-password">Password</Label>
          <PasswordInput
            id="signup-password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              if (errors.password) setErrors((e) => ({ ...e, password: null }));
            }}
            {...field("password")}
          />
          <FieldError id="signup-password-error" message={errors.password} />
        </div>
        <FormAlert message={submitError} />
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <LoaderCircle className="size-4 animate-spin" aria-hidden />
              Creating your account…
            </>
          ) : (
            "Create account"
          )}
        </Button>
      </form>
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/login"
          className="rounded-sm font-medium text-foreground underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
