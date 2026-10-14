/**
 * Slash shortcuts (SPEC-260): `/revenue 30d` in the message box becomes the full
 * question the analyst has a tool for. Pure — the composer only draws the menu
 * and calls these.
 */

export type SlashArg = "period" | "name" | "none";

export interface SlashCommand {
  name: string;
  arg: SlashArg;
  /** What the menu shows as the argument hint. */
  hint: string;
  /** What it asks, with `{period}` / `{name}` filled at send time. */
  question: string;
  /** One line for the menu. */
  summary: string;
}

export const DEFAULT_PERIOD = "7d";

const PERIODS: Record<string, string> = {
  today: "today",
  yesterday: "yesterday",
  "7d": "last 7 days",
  "30d": "last 30 days",
  "90d": "last 90 days",
};

export const SLASH_COMMANDS: readonly SlashCommand[] = [
  { name: "revenue", arg: "period", hint: "[period]", question: "How is revenue for the {period}, and how does it compare to the period before?", summary: "Revenue and the change vs the period before" },
  { name: "orders", arg: "period", hint: "[period]", question: "How many orders in the {period}, and how does that compare to the period before?", summary: "Order count and the change" },
  { name: "top", arg: "period", hint: "[period]", question: "What were my top products by revenue in the {period}?", summary: "Best-selling products" },
  { name: "worst", arg: "period", hint: "[period]", question: "Which products sold worst in the {period}?", summary: "Worst-selling products" },
  { name: "customers", arg: "period", hint: "[period]", question: "New vs returning customers in the {period}?", summary: "New vs returning" },
  { name: "vip", arg: "none", hint: "", question: "Which of my best customers have gone quiet?", summary: "Best customers going quiet" },
  { name: "stock", arg: "none", hint: "", question: "Anything low on stock I should reorder?", summary: "Low stock to reorder" },
  { name: "dead", arg: "none", hint: "", question: "What is sitting as dead stock right now?", summary: "Dead stock" },
  { name: "returns", arg: "period", hint: "[period]", question: "Why are customers returning items in the {period}?", summary: "Return reasons" },
  { name: "discounts", arg: "period", hint: "[period]", question: "Where are discounts hurting margin in the {period}?", summary: "Discounts hurting margin" },
  { name: "support", arg: "period", hint: "[period]", question: "How is the support team performing in the {period}?", summary: "Support team performance" },
  { name: "warehouse", arg: "none", hint: "", question: "How is warehouse packing going right now?", summary: "Warehouse packing" },
  { name: "traffic", arg: "period", hint: "[period]", question: "How is store footfall and conversion in the {period}?", summary: "Footfall and conversion" },
  { name: "tax", arg: "none", hint: "", question: "What is my sales tax position this month?", summary: "Sales tax position" },
  { name: "compare", arg: "none", hint: "", question: "Compare this week to last week — revenue, orders and AOV.", summary: "This week vs last week" },
  { name: "product", arg: "name", hint: "<product>", question: 'How is "{name}" selling — units, revenue and returns?', summary: "One product's sales and returns" },
  { name: "store", arg: "name", hint: "<store>", question: "How is the {name} store doing — revenue, orders and footfall?", summary: "One store's revenue and footfall" },
  { name: "watch", arg: "name", hint: "<rule>", question: "Tell me when {name}", summary: "Watch a figure — e.g. returns on Linen Shirt pass 20%" },
  { name: "help", arg: "none", hint: "", question: "", summary: "Show these shortcuts" },
];

export const PERIOD_OPTIONS = Object.keys(PERIODS);

/** "7d" → "last 7 days"; an unknown period is kept as typed. */
export function periodPhrase(arg: string | null): string {
  const key = (arg ?? "").trim().toLowerCase();
  if (!key) return PERIODS[DEFAULT_PERIOD];
  return PERIODS[key] ?? key;
}

export interface ParsedSlash {
  /** The word after the slash, lower-cased. */
  command: string;
  /** Everything after the first space, trimmed; "" when none. */
  arg: string;
  /** True while the owner is still typing the command word (no space yet). */
  typing: boolean;
}

/** `/revenue 30d` → { command: "revenue", arg: "30d" }; null unless the text starts with "/". */
export function parseSlash(text: string): ParsedSlash | null {
  const match = /^\/([a-z]*)(\s+([\s\S]*))?$/i.exec(text.trimStart());
  if (!match) return null;
  return {
    command: match[1].toLowerCase(),
    arg: (match[3] ?? "").trim(),
    typing: match[2] === undefined,
  };
}

/** The commands whose name starts with `query` (all when empty), menu order. */
export function filterSlash(query: string): SlashCommand[] {
  const needle = query.trim().toLowerCase();
  return SLASH_COMMANDS.filter((command) => command.name.startsWith(needle));
}

export function findSlash(name: string): SlashCommand | null {
  return SLASH_COMMANDS.find((command) => command.name === name.toLowerCase()) ?? null;
}

export type SlashExpansion =
  | { kind: "send"; question: string }
  | { kind: "needs-name"; command: SlashCommand }
  | { kind: "help" }
  | { kind: "not-a-shortcut" };

/** What pressing Send on `text` should do. */
export function expandSlash(text: string): SlashExpansion {
  const parsed = parseSlash(text);
  if (!parsed) return { kind: "not-a-shortcut" };
  const command = findSlash(parsed.command);
  if (!command) return { kind: "not-a-shortcut" };
  if (command.name === "help") return { kind: "help" };
  if (command.arg === "name") {
    if (!parsed.arg) return { kind: "needs-name", command };
    return { kind: "send", question: command.question.replace("{name}", parsed.arg) };
  }
  if (command.arg === "period") {
    return { kind: "send", question: command.question.replace("{period}", periodPhrase(parsed.arg)) };
  }
  return { kind: "send", question: command.question };
}
