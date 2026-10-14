/**
 * The source scan behind `role-gate-coverage.test.ts` (frontend SPEC-358, root ABSOLUTE RULE
 * 13). Pure over source text so the test can also run it on planted examples.
 */
import type { ActionNeed } from "@/lib/action-permissions";

const WRITE_VERB = /"(POST|PUT|PATCH|DELETE)"/;
const DECLARATION = /^(export\s+)?(async\s+)?function\s+(\w+)|^(export\s+)?const\s+(\w+)\s*=/gm;

/** The exported functions of a services module that write — directly, or through a module
 * helper that does. */
export function writeFunctions(source: string): string[] {
  const found = [...source.matchAll(DECLARATION)];
  const chunks = found.map((m, i) => ({
    name: (m[3] ?? m[5]) as string,
    exported: Boolean(m[1] ?? m[4]),
    body: source.slice(m.index, i + 1 < found.length ? found[i + 1].index : source.length),
  }));
  const writers = new Set(chunks.filter((c) => WRITE_VERB.test(c.body)).map((c) => c.name));
  let grew = true;
  while (grew) {
    grew = false;
    for (const c of chunks) {
      if (writers.has(c.name)) continue;
      if ([...writers].some((w) => new RegExp(`\\b${w}\\s*[(<]`).test(c.body))) {
        writers.add(c.name);
        grew = true;
      }
    }
  }
  return chunks.filter((c) => c.exported && writers.has(c.name)).map((c) => c.name);
}

/** `import { a, b as c } from "<module>"` → { module: [a, b] } (the imported, not local, names). */
export function namedImports(source: string): Map<string, string[]> {
  const out = new Map<string, string[]>();
  for (const m of source.matchAll(/import\s+(?:type\s+)?\{([^}]*)\}\s+from\s+"([^"]+)"/g)) {
    if (/^import\s+type\b/.test(m[0])) continue;
    const names = m[1]
      .split(",")
      .map((part) => part.trim())
      .filter((part) => part && !part.startsWith("type "))
      .map((part) => part.split(/\s+as\s+/)[0].trim());
    out.set(m[2], [...(out.get(m[2]) ?? []), ...names]);
  }
  return out;
}

export const GATE_MODULES = ["@/hooks/use-can", "@/components/shared/role-gate", "@/lib/team"];

export function writesDirectly(source: string): boolean {
  return WRITE_VERB.test(source);
}

export interface Needs {
  /** Every one must be gated: writes the screen imports itself. */
  permissions: Set<string>;
  /** At least one must be gated: writes bundled in a `use-*-actions` hook the screen uses —
   * a screen usually calls a few of a hook's actions, not all of them. */
  viaHooks: Set<string>;
  owner: boolean;
}

export function addNeed(needs: Needs, need: ActionNeed): void {
  if (need === "member") return;
  if (need === "owner") {
    needs.owner = true;
    return;
  }
  for (const permission of need) needs.permissions.add(permission);
}

export function isGated(source: string, needs: Needs): string[] {
  const problems: string[] = [];
  if (needs.permissions.size === 0 && needs.viaHooks.size === 0 && !needs.owner) return problems;
  const imports = namedImports(source);
  if (!GATE_MODULES.some((module) => imports.has(module))) {
    problems.push("does not use the role gate (hooks/use-can or components/shared/role-gate)");
  }
  for (const permission of needs.permissions) {
    if (!source.includes(`"${permission}"`)) problems.push(`does not gate "${permission}"`);
  }
  const hooked = [...needs.viaHooks].filter((p) => !needs.permissions.has(p));
  if (hooked.length && !hooked.some((p) => source.includes(`"${p}"`))) {
    problems.push(`does not gate any of its hook's writes (${hooked.join(", ")})`);
  }
  return problems;
}
