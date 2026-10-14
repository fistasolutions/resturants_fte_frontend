"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError } from "@/features/auth/field-error";
import { FormAlert } from "@/features/auth/form-alert";
import { createOrganization } from "@/services/onboarding";

export function OrganizationStep() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const clean = name.trim();
    if (clean.length < 2) {
      setFieldError("Enter your company's name.");
      document.getElementById("org-name")?.focus();
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await createOrganization(clean);
      router.refresh();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Could not create the company.");
      setBusy(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={submit} noValidate>
      <div className="space-y-2">
        <Label htmlFor="org-name">Company name</Label>
        <Input
          id="org-name"
          autoFocus
          autoComplete="organization"
          placeholder="Your company"
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            if (fieldError) setFieldError(null);
          }}
          aria-invalid={Boolean(fieldError)}
          aria-describedby={fieldError ? "org-name-error" : undefined}
        />
        <FieldError id="org-name-error" message={fieldError} />
      </div>
      <FormAlert message={error} />
      <Button type="submit" className="w-full" disabled={busy}>
        {busy ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : null}
        Continue
      </Button>
    </form>
  );
}
