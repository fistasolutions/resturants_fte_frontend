"use client";

import { Button } from "@/components/ui/button";

/** The console opened this tab, so the tab may close itself. */
export function CloseTabButton() {
  return (
    <Button variant="outline" onClick={() => window.close()}>
      Close this tab
    </Button>
  );
}
