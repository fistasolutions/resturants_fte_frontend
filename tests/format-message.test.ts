import { describe, expect, it } from "vitest";

import { cleanMessageBody } from "@/lib/format-message";

describe("cleanMessageBody", () => {
  it("returns null for empty/nullish input", () => {
    expect(cleanMessageBody(null)).toBeNull();
    expect(cleanMessageBody("")).toBeNull();
    expect(cleanMessageBody("   \n  \n")).toBeNull();
  });

  it("strips tracking URLs (parenthetical and bare)", () => {
    const out = cleanMessageBody(
      "TRACK MY ORDER (https://ctrk.klclick.com/l/01KZA_3) now\nvisit https://x.co/abc please",
    );
    expect(out).not.toContain("http");
    expect(out).toContain("TRACK MY ORDER");
    expect(out).toContain("now");
  });

  it("removes marketing/footer boilerplate lines", () => {
    const out = cleanMessageBody(
      [
        "Your order is on its way!",
        "UNLOCK exclusive PERKS: Make the Most of Your Store Experience!",
        "NEED SUPPORT?",
        "© 2026 Example Store | All Rights Reserved Unsubscribe",
      ].join("\n"),
    );
    expect(out).toBe("Your order is on its way!");
  });

  it("collapses runs of blank lines to a single blank", () => {
    expect(cleanMessageBody("A\n\n\n\nB")).toBe("A\n\nB");
  });

  it("dedupes an immediately-repeated line", () => {
    expect(
      cleanMessageBody("It's on the way!\nIt's on the way!\nThanks"),
    ).toBe("It's on the way!\nThanks");
  });

  it("keeps a normal message intact", () => {
    expect(cleanMessageBody("Where is my order? It hasn't arrived.")).toBe(
      "Where is my order? It hasn't arrived.",
    );
  });

  it("cuts the quoted reply chain (On … wrote: + > lines)", () => {
    const out = cleanMessageBody(
      [
        "Hi Sarah, happy to help with the return.",
        "",
        "On Thu, Aug 06 2026, at 06:32 AM, Sarah sham <torah303@gmail.com> wrote:",
        "> Hi i need to return two items, the sizing is too big.",
        "> Thank you",
      ].join("\n"),
    );
    expect(out).toBe("Hi Sarah, happy to help with the return.");
    expect(out).not.toContain("wrote:");
    expect(out).not.toContain("torah303");
  });

  it("strips markdown-link/image remnants and a trailing signature", () => {
    const out = cleanMessageBody(
      [
        "You can start the return here: [here](https://x.co/r) and select the items.",
        "",
        "Let me know if there's anything else!",
        "",
        "Customer Service",
        "[www.examplestore.com]",
        "Join our new Whatsapp Status for Exclusive Store Content! WhatsApp 516-757-7793 to join!",
        "Follow us @examplestore",
        "![]",
      ].join("\n"),
    );
    expect(out).toBe(
      "You can start the return here: here and select the items.\n\nLet me know if there's anything else!",
    );
  });
});
