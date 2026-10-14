"use client";

import { FileDown, LoaderCircle } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

/** Export a real, backend-generated PDF of the report (D-06, backend SPEC-107)
 * for daily / weekly / monthly. Fetches through the proxy (auth injected there)
 * and downloads the blob client-side so the filename is set regardless of
 * upstream headers. */
export function ExportPdfButton({
  date,
  scope = "all",
  period = "daily",
}: {
  date: string;
  scope?: string;
  period?: string;
}) {
  const [loading, setLoading] = useState(false);

  async function download() {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/proxy/reports/${date}/pdf?scope=${encodeURIComponent(scope)}&period=${period}`,
      );
      if (!res.ok) throw new Error("PDF export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `report-${period}-${date}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch {
      // The button simply re-enables; the on-screen report is unaffected.
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={download}
      disabled={loading}
      className="print:hidden"
    >
      {loading ? (
        <LoaderCircle className="size-4 animate-spin" aria-hidden />
      ) : (
        <FileDown className="size-4" aria-hidden />
      )}
      Export PDF
    </Button>
  );
}
