"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, Upload } from "lucide-react";

import { RoleButton } from "@/components/shared/role-gate";

type Result = { imported: number; updated: number; skipped: number } | null;

/** Manual iPacky Order Check Report upload (SPEC-097) — the client-sanctioned
 * path, and the fallback the nightly scraper reuses. Posts the .xlsx through the
 * server proxy to the ingest endpoint. */
export function IpackyUpload() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result>(null);
  const [error, setError] = useState<string | null>(null);

  async function onFile(file: File) {
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/proxy/warehouse/ipacky/import", { method: "POST", body });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error?.message ?? "Import failed.");
      setResult(data);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Import failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xlsm"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void onFile(f);
          e.target.value = "";
        }}
      />
      <RoleButton
        need="warehouse.manage"
        variant="outline"
        size="sm"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
      >
        {busy ? (
          <LoaderCircle className="size-4 animate-spin" aria-hidden />
        ) : (
          <Upload className="size-4" aria-hidden />
        )}
        Import iPacky report
      </RoleButton>
      {result && (
        <span className="text-sm text-muted-foreground">
          Imported <span className="font-medium text-foreground">{result.imported}</span> · updated{" "}
          {result.updated} · skipped {result.skipped}
        </span>
      )}
      {error && (
        <span role="alert" className="text-sm text-destructive">
          {error}
        </span>
      )}
    </div>
  );
}
