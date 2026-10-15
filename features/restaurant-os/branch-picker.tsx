"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useApiQuery } from "@/hooks/use-api-query";
import { restaurantQueries } from "@/lib/queries/restaurant";
import { withParams } from "@/lib/restaurant";
import type { Branch } from "@/types/restaurant";

/** The branch a screen works for — URL state (`?branch=`); defaults to the first open branch the
 * member sees. */
export function useBranchChoice(): { branches: Branch[]; branch: Branch | null; loading: boolean; error: Error | null } {
  const params = useSearchParams();
  const query = useApiQuery(restaurantQueries.branches());
  const branches = (query.data ?? []).filter((b) => b.status === "open" || b.status === "temporarily_closed");
  const wanted = Number(params.get("branch"));
  const branch = branches.find((b) => b.id === wanted) ?? branches[0] ?? null;
  return { branches, branch, loading: query.isPending, error: query.error };
}

export function BranchPicker({ branches, branch }: { branches: Branch[]; branch: Branch | null }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const current = Object.fromEntries(params.entries());
  if (branches.length <= 1) {
    return branch ? <span className="text-sm font-medium text-foreground">#{branch.code} {branch.name}</span> : null;
  }
  return (
    <Select value={branch ? String(branch.id) : undefined} onValueChange={(value) => router.push(withParams(pathname, current, { branch: value }))}>
      <SelectTrigger className="h-9 w-[240px]" aria-label="Branch">
        <SelectValue placeholder="Choose a branch" />
      </SelectTrigger>
      <SelectContent>
        {branches.map((b) => (
          <SelectItem key={b.id} value={String(b.id)}>
            #{b.code} {b.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
