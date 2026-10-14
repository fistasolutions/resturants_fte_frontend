/**
 * Root ABSOLUTE RULE 13 / frontend SPEC-358 — every write a screen can make follows the member's
 * role. Fails the build when a write is missing from `lib/action-permissions.ts`, names an
 * unknown permission, or reaches a screen that does not gate it.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

import { describe, expect, it } from "vitest";

import { ACTION_PERMISSIONS, SCREEN_WRITES, type ActionNeed } from "@/lib/action-permissions";
import { isPermission } from "@/lib/permissions";

import {
  addNeed,
  isGated,
  namedImports,
  writeFunctions,
  writesDirectly,
  type Needs,
} from "./role-coverage-scan";

const ROOT = join(__dirname, "..");

/** Screens outside the rule, each for a reason. */
const EXEMPT: Record<string, string> = {
  "app/(auth)/": "sign-in comes before any membership",
  "features/auth/": "sign-in comes before any membership",
  "features/onboarding/": "the organization's creator is its owner",
  "app/onboarding/": "the organization's creator is its owner",
  "app/api/": "route handlers: the session and the proxy, not screens",
  "components/ui/": "shadcn primitives",
};

function files(dir: string, ext: RegExp): string[] {
  const out: string[] = [];
  const walk = (d: string) => {
    for (const entry of readdirSync(d, { withFileTypes: true })) {
      const path = join(d, entry.name);
      if (entry.isDirectory()) {
        if (entry.name !== "node_modules") walk(path);
      } else if (ext.test(entry.name)) {
        out.push(relative(ROOT, path));
      }
    }
  };
  walk(join(ROOT, dir));
  return out.sort();
}

const read = (path: string) => readFileSync(join(ROOT, path), "utf8");

/** `services/x.ts` exports that write → their registry key. */
function serviceWrites(): Map<string, string[]> {
  const out = new Map<string, string[]>();
  for (const path of files("services", /\.ts$/)) {
    const fns = writeFunctions(read(path));
    if (fns.length) out.set(path.replace(/^services\//, "").replace(/\.ts$/, ""), fns);
  }
  return out;
}

const WRITES = serviceWrites();

/** The registry need of an import from `@/services/<module>`, or null when it does not write. */
function needOf(module: string, name: string): ActionNeed | null {
  if (!WRITES.get(module)?.includes(name)) return null;
  return ACTION_PERMISSIONS[`${module}:${name}`] ?? null;
}

function needsOfImports(source: string, hooks: Map<string, Needs>): Needs {
  const needs: Needs = { permissions: new Set(), viaHooks: new Set(), owner: false };
  for (const [from, names] of namedImports(source)) {
    if (from.startsWith("@/services/")) {
      const serviceModule = from.slice("@/services/".length);
      for (const name of names) {
        const need = needOf(serviceModule, name);
        if (need) addNeed(needs, need);
      }
    }
    const hook = hooks.get(from);
    if (hook) {
      for (const permission of hook.permissions) needs.viaHooks.add(permission);
      needs.owner ||= hook.owner;
    }
  }
  return needs;
}

/** `.ts` modules under features/ and hooks/ that import a write pass it to their screens. */
function writeHooks(): Map<string, Needs> {
  const out = new Map<string, Needs>();
  for (const path of [...files("features", /\.ts$/), ...files("hooks", /\.ts$/)]) {
    const needs = needsOfImports(read(path), new Map());
    if (needs.permissions.size || needs.owner) out.set(`@/${path.replace(/\.ts$/, "")}`, needs);
  }
  return out;
}

describe("the action registry", () => {
  it("names every write function in services/*.ts, and nothing else", () => {
    const expected = new Set<string>();
    for (const [module, fns] of WRITES) for (const fn of fns) expected.add(`${module}:${fn}`);
    const missing = [...expected].filter((key) => !(key in ACTION_PERMISSIONS));
    const stale = Object.keys(ACTION_PERMISSIONS).filter((key) => !expected.has(key));
    expect(missing, "add these to ACTION_PERMISSIONS (lib/action-permissions.ts)").toEqual([]);
    expect(stale, "these no longer write or no longer exist").toEqual([]);
  });

  it("names every screen that writes directly, and nothing else", () => {
    const screens = [...files("features", /\.tsx$/), ...files("components", /\.tsx$/)].filter(
      (path) =>
        !Object.keys(EXEMPT).some((prefix) => path.startsWith(prefix)) &&
        writesDirectly(read(path)),
    );
    const missing = screens.filter((path) => !(path in SCREEN_WRITES));
    const stale = Object.keys(SCREEN_WRITES).filter(
      (path) => !screens.includes(path) && !path.startsWith("features/onboarding/"),
    );
    expect(missing, "add these to SCREEN_WRITES (lib/action-permissions.ts)").toEqual([]);
    expect(stale, "these no longer write directly").toEqual([]);
  });

  it("uses only real permissions", () => {
    const bad = Object.entries({ ...ACTION_PERMISSIONS, ...SCREEN_WRITES }).flatMap(
      ([key, need]) =>
        need === "member" || need === "owner"
          ? []
          : need.filter((p) => !isPermission(p)).map((p) => `${key}: ${p}`),
    );
    expect(bad).toEqual([]);
  });
});

describe("every screen gates the writes it can make", () => {
  it("each non-member write is behind the member's role", () => {
    const hooks = writeHooks();
    const screens = [
      ...files("features", /\.tsx$/),
      ...files("components", /\.tsx$/),
      ...files("app", /\.tsx$/),
    ].filter((path) => !Object.keys(EXEMPT).some((prefix) => path.startsWith(prefix)));
    const problems: string[] = [];
    for (const path of screens) {
      const source = read(path);
      const needs = needsOfImports(source, hooks);
      const direct = SCREEN_WRITES[path];
      if (direct) addNeed(needs, direct);
      for (const problem of isGated(source, needs)) problems.push(`${path}: ${problem}`);
    }
    expect(problems).toEqual([]);
  });
});

describe("the scan itself", () => {
  const service = `
const ROOT = "/x";
async function call(method: "POST", path: string) { return fetch(path, { method }); }
export function read() { return fetch("/x"); }
export function publish(id: number) { return call("POST", \`/posts/\${id}/publish\`); }
`;

  it("finds a write made through a module helper, and not a read", () => {
    expect(writeFunctions(service)).toEqual(["publish"]);
  });

  it("fails an ungated screen and a screen that gates the wrong permission", () => {
    const needs: Needs = {
      permissions: new Set(["social.publish"]),
      viaHooks: new Set(),
      owner: false,
    };
    expect(isGated(`import { publishPost } from "@/services/social-actions";`, needs)).toHaveLength(
      2,
    );
    const wrong = `import { RoleButton } from "@/components/shared/role-gate";\n<RoleButton need="social.manage" />`;
    expect(isGated(wrong, needs)).toEqual([`does not gate "social.publish"`]);
    const right = `import { RoleButton } from "@/components/shared/role-gate";\n<RoleButton need="social.publish" />`;
    expect(isGated(right, needs)).toEqual([]);
  });

  it("holds a screen using an actions hook to at least one of the hook's permissions", () => {
    const needs: Needs = {
      permissions: new Set(),
      viaHooks: new Set(["finance.manage", "integrations.manage"]),
      owner: false,
    };
    const gate = `import { RoleButton } from "@/components/shared/role-gate";\n`;
    expect(isGated(`${gate}<RoleButton need="finance.manage" />`, needs)).toEqual([]);
    expect(isGated(`${gate}<RoleButton need="social.manage" />`, needs)).toHaveLength(1);
  });

  it("reads imported names, not local aliases, and skips type-only imports", () => {
    const imports = namedImports(
      `import { a, b as c, type T } from "@/services/m";\nimport type { U } from "@/services/n";`,
    );
    expect(imports.get("@/services/m")).toEqual(["a", "b"]);
    expect(imports.has("@/services/n")).toBe(false);
  });
});
