"use client";

import { Button } from "@/components/ui/button";
import { logout } from "@/services/auth";

export function SignOutButton() {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={async () => {
        await logout();
        window.location.replace("/login");
      }}
    >
      Sign out
    </Button>
  );
}
