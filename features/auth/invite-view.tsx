"use client";

import Link from "next/link";
import { useState } from "react";
import { LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { goAfterSignIn } from "@/features/auth/after-sign-in";
import { FieldError } from "@/features/auth/field-error";
import { FormAlert } from "@/features/auth/form-alert";
import { PasswordInput } from "@/features/auth/password-input";
import { acceptInvitation, register, type InvitationPreview } from "@/services/auth";
import { validateName, validatePassword } from "@/utils/validation";

/**
 * An invitation (SPEC-312): who invited you into what. With no account yet the
 * link itself proves the address, so it is name + password and you are in. With
 * an account: sign in (and come back here), or accept at once if you already are.
 */
export function InviteView({
  token,
  preview,
  signedIn,
}: {
  token: string;
  preview: InvitationPreview;
  signedIn: boolean;
}) {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ name: string | null; password: string | null }>({
    name: null,
    password: null,
  });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const back = `/invite/${token}`;

  async function accept() {
    setBusy(true);
    setError(null);
    try {
      goAfterSignIn(await acceptInvitation(token));
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Could not accept the invitation.");
      setBusy(false);
    }
  }

  async function createAccount(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = { name: validateName(name), password: validatePassword(password) };
    setErrors(next);
    if (next.name || next.password) return;
    setBusy(true);
    setError(null);
    try {
      const result = await register({
        name,
        email: preview.email,
        password,
        invitationToken: token,
      });
      if (result) goAfterSignIn(result);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Could not create the account.");
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        You&apos;re invited to <span className="font-medium text-foreground">{preview.organizationName}</span>{" "}
        as <span className="font-medium text-foreground">{preview.roleName}</span>, with{" "}
        <span className="font-medium text-foreground">{preview.email}</span>.
      </p>

      {signedIn ? (
        <div className="space-y-3">
          <FormAlert message={error} />
          <Button className="w-full" disabled={busy} onClick={() => void accept()}>
            {busy ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : null}
            Accept and open {preview.organizationName}
          </Button>
        </div>
      ) : preview.hasAccount ? (
        <Button asChild className="w-full">
          <Link href={`/login?next=${encodeURIComponent(back)}`}>Sign in to accept</Link>
        </Button>
      ) : (
        <form className="space-y-4" onSubmit={createAccount} noValidate>
          <div className="space-y-2">
            <Label htmlFor="invite-email">Email</Label>
            <Input id="invite-email" value={preview.email} readOnly disabled />
          </div>
          <div className="space-y-2">
            <Label htmlFor="invite-name">Your name</Label>
            <Input
              id="invite-name"
              autoComplete="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? "invite-name-error" : undefined}
            />
            <FieldError id="invite-name-error" message={errors.name} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="invite-password">Choose a password</Label>
            <PasswordInput
              id="invite-password"
              autoComplete="new-password"
              placeholder="At least 8 characters"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? "invite-password-error" : undefined}
            />
            <FieldError id="invite-password-error" message={errors.password} />
          </div>
          <FormAlert message={error} />
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : null}
            Join {preview.organizationName}
          </Button>
        </form>
      )}
    </div>
  );
}
