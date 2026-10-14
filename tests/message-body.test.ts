import { describe, expect, it } from "vitest";

import {
  attachmentKind,
  formatBytes,
  parseMessageBody,
  readReplyHeader,
  senderInitial,
  shortUrl,
  tokenizeLine,
  type MessageBlock,
} from "@/lib/message-body";

/** The blocks back as plain strings — links as `[label]`, an address as `Title: a | b`, an
 * order as `ORDER …` — for readable assertions. */
function text(blocks: MessageBlock[]): string[] {
  return blocks.map((block) => {
    if (block.kind === "address") return `${block.title}: ${block.lines.join(" | ")}`;
    if (block.kind === "order") {
      const items = block.items.map((i) => `${i.name} x${i.quantity ?? "?"} = ${i.total ?? "?"}`);
      const totals = block.totals.map((t) => `${t.grand ? "*" : ""}${t.label} ${t.value}`);
      return `ORDER ${items.join("; ")} || ${totals.join("; ")}`;
    }
    return block.lines.map((line) => line.map((t) => (t.kind === "text" ? t.text : `[${t.label}]`)).join("").trim()).join("\n");
  });
}

// A real thread (SPEC-348 §1b): a customer reply, her earlier reply, and the store's order
// confirmation underneath — as Gmail's HTML-to-text writes it.
const THREAD = [
  "Thanks, that works!",
  "",
  "On Fri, Sep 25, 2026 at 1:27 PM Gitty Greenfeld <gshtesl1@gmail.com> wrote:",
  "> Hi,",
  "> I placed the order specifically after the cut off date because I wanted it to be shipped after succos.",
  ">",
  "> On Thu, Sep 24, 2026 at 10:28 PM Fame on Central <website@fameoncentral.com> wrote:",
  ">> THANK you FOR SHOPPING!",
  ">> THANK you FOR SHOPPING! This email is to confirm your order on 09/24/2026.",
  ">> 1381 58th Street (https://www.google.com/maps/search/1381+58th+Street?entry=gmail&source=g)",
  ">> Brooklyn, New York 11219 (https://www.google.com/maps/search/Brooklyn?entry=gmail)",
  ">> United States Order Details:",
  ">> Order Details:",
  ">> Ribbed Crew Neck Cardigan-Eggplant - S / MEL5043",
  ">> Quantity: 1",
  ">> NEED SUPPORT? Have questions about an existing order? Email info@fameoncentral.com to get in touch with our team!",
  ">> NEED SUPPORT? Have questions about an existing order? Email info@fameoncentral.com to get in touch with our team!",
  ">> © 2026 Fame on Central | All Rights Reserved",
  ">> Orders sold through Shop marketplace.",
].join("\n");

describe("parseMessageBody — the history as separate messages", () => {
  const parsed = parseMessageBody(THREAD);

  it("keeps only the new words visible", () => {
    expect(text(parsed.visible)).toEqual(["Thanks, that works!"]);
    expect(parsed.footer).toEqual([]);
  });

  it("splits the history into one entry per earlier message, with sender and date", () => {
    expect(parsed.earlier.map((m) => [m.from, m.email, m.date])).toEqual([
      ["Gitty Greenfeld", "gshtesl1@gmail.com", "Fri, Sep 25, 2026 at 1:27 PM"],
      ["Fame on Central", "website@fameoncentral.com", "Thu, Sep 24, 2026 at 10:28 PM"],
    ]);
    expect(text(parsed.earlier[0].body).join("\n")).toContain("I placed the order specifically after the cut off date");
  });

  it("drops HTML-to-text duplicates and map links, and folds the store footer", () => {
    const order = parsed.earlier[1];
    const body = text(order.body).join("\n");
    expect(body.match(/THANK you FOR SHOPPING!/g)).toHaveLength(1);
    // "Order Details:" (twice in the text) is one order table now.
    expect(body).toContain("ORDER Ribbed Crew Neck Cardigan-Eggplant - S / MEL5043 x1");
    expect(body).not.toContain("Order Details");
    expect(body).toContain("1381 58th Street");
    expect(body).not.toContain("google.com");
    expect(body).not.toContain("NEED SUPPORT");
    const footer = text(order.footer).join("\n");
    expect(footer.match(/NEED SUPPORT/g)).toHaveLength(1);
    expect(footer).toContain("All Rights Reserved");
  });
});

describe("parseMessageBody — an order email reads as a receipt (§1c)", () => {
  // As the screenshot showed it: labels run together on lines, items one field per line.
  const ORDER = [
    "On Sat, Sep 19, 2026 at 9:02 PM Fame on Central <website@fameoncentral.com> wrote:",
    "> This email is to confirm your order on 09/19/2026. Your order number is 641682. Billing Address: Yocheved Zimmerman",
    "> 24 Yerek Drive",
    "> Lakewood, New Jersey 08701",
    "> United States Shipping Address: Yocheved Zimmerman",
    "> 24 Yerek Drive",
    "> Lakewood, New Jersey 08701",
    "> United States Order Details:",
    "> SWING TURTLENECK-BLACK - S / MEL226",
    "> Quantity: 1",
    "> Total: $39.00",
    '> Short Flare Skirt 24"-Black - 8 / HA2037',
    "> Quantity: 1",
    "> Total: $98.00",
    "> Solid Faux Satin Slip Skirt-Black - M / HA726",
    "> Quantity: 1",
    "> Total: $59.00 Discount (code: PPM-pxMLUXC): -$25.00 Subtotal: $171.00 Shipping: $0.00 Total: $171.00 SHOP by STYLE:",
    "> SHOP by STYLE: BLACK DENIM SHOP NOW",
  ].join("\n");

  it("splits the labels run into lines, and draws addresses and the order as blocks", () => {
    const parsed = parseMessageBody(`Where is my order?\n\n${ORDER}`);
    expect(text(parsed.visible)).toEqual(["Where is my order?"]);
    const [message] = parsed.earlier;
    expect(message.from).toBe("Fame on Central");
    expect(text(message.body)).toEqual([
      "This email is to confirm your order on 09/19/2026. Your order number is 641682.",
      "Billing address: Yocheved Zimmerman | 24 Yerek Drive | Lakewood, New Jersey 08701 | United States",
      "Shipping address: Yocheved Zimmerman | 24 Yerek Drive | Lakewood, New Jersey 08701 | United States",
      'ORDER SWING TURTLENECK-BLACK - S / MEL226 x1 = $39.00; Short Flare Skirt 24"-Black - 8 / HA2037 x1 = $98.00; Solid Faux Satin Slip Skirt-Black - M / HA726 x1 = $59.00 || Discount (code: PPM-pxMLUXC) -$25.00; Subtotal $171.00; Shipping $0.00; *Total $171.00',
    ]);
    // The marketing line that was run into the totals is the footer now.
    expect(text(message.footer).join(" ")).toContain("SHOP by STYLE");
  });

  it("reads an order without a heading, and leaves prose with a colon alone", () => {
    const parsed = parseMessageBody("Blue Mug\nQuantity: 2\nPrice: $10.00\nTotal: $20.00\n\nThanks for asking: it shipped.");
    expect(text(parsed.visible)).toEqual(["ORDER Blue Mug x2 = $10.00 || *Total $20.00", "Thanks for asking: it shipped."]);
  });
});

describe("parseMessageBody — a flattened email (§1e)", () => {
  // A PR agency thread as the helpdesk stored it: line breaks lost, three emails on few lines.
  const FLAT = [
    "Hi there, Just wanted to send a quick note to confirm your receipt of the details. Talk soon, Michelle Wendell Founder & CEO, CLD PR 310.403.6929 Mobile (tel:(310)%20403-6929) www.CLDPR.com Instagram: @CLDStyle On Thu, Oct 1, 2026 at 7:00 AM CLD PR contact@cldstylehouse.com wrote: Hi, Happy Thursday! With Q4 just around the corner, we are finalizing brand partners. Talk soon, Michelle On Mon, Sep 28, 2026 at 12:58 PM CLD PR contact@cldstylehouse.com wrote: contact@cldstylehouse.com Hi, Happy Monday, Q4 is the most important sales window of the year.",
    "More details here, with an Unsubscribe link somewhere inside a very long line of real content that keeps going and going so that it is clearly not a footer line at all but part of the message body itself.",
  ].join("\n");

  it("restores the reply headers and splits the history into its emails", () => {
    const parsed = parseMessageBody(FLAT);
    const visible = text(parsed.visible).join("\n");
    expect(visible).toContain("Just wanted to send a quick note");
    expect(visible).not.toContain("Happy Thursday");
    expect(visible).not.toContain("tel:");
    expect(parsed.earlier.map((m) => [m.from, m.email, m.date])).toEqual([
      ["CLD PR", "contact@cldstylehouse.com", "Thu, Oct 1, 2026 at 7:00 AM"],
      ["CLD PR", "contact@cldstylehouse.com", "Mon, Sep 28, 2026 at 12:58 PM"],
    ]);
    expect(text(parsed.earlier[0].body).join(" ")).toContain("Happy Thursday!");
    expect(text(parsed.earlier[1].body).join(" ")).toMatch(/^Hi, Happy Monday/);
    // An "Unsubscribe" inside a long line of content does not fold the content away.
    expect(text(parsed.earlier[1].body).join(" ")).toContain("More details here");
    expect(parsed.earlier[1].footer).toEqual([]);
  });

  it("links www. addresses and drops tel: links", () => {
    expect(tokenizeLine("Mobile 310.403.6929 (tel:(310)%20403-6929) www.CLDPR.com")).toEqual([
      { kind: "text", text: "Mobile 310.403.6929 " },
      { kind: "link", href: "https://www.CLDPR.com", label: "cldpr.com", compact: false },
    ]);
  });
});

describe("parseMessageBody — headers and signatures", () => {
  it("reads German and wrapped English headers", () => {
    const german = parseMessageBody(
      "Size 2 is fine.\n\nAm Di., 6. Okt. 2026 um 16:57 Uhr schrieb Fame on Central < website@fameoncentral.com>:\n(mailto:website@fameoncentral.com)\n\nWe are out of stock in the skirt.",
    );
    expect(text(german.visible)).toEqual(["Size 2 is fine."]);
    expect(german.earlier[0]).toMatchObject({ from: "Fame on Central", email: "website@fameoncentral.com", date: "Di., 6. Okt. 2026 um 16:57 Uhr" });
    expect(text(german.earlier[0].body).join("\n")).toContain("We are out of stock");

    const wrapped = parseMessageBody("Ok, thanks.\n\nOn Tue, Oct 06 2026, at 04:15 PM, Mindy Bamberger <\nmindy@gmail.com> wrote:\n> What will happen now?");
    expect(text(wrapped.visible)).toEqual(["Ok, thanks."]);
    expect(wrapped.earlier[0]).toMatchObject({ from: "Mindy Bamberger", email: "mindy@gmail.com", date: "Tue, Oct 06 2026, at 04:15 PM" });
  });

  it("reads Outlook blocks", () => {
    const parsed = parseMessageBody("Hello\n\nFrom: Store Team <team@store.com>\nSent: Monday, 5 October 2026 09:00\nTo: me@x.com\nSubject: Your order\n\nIt shipped.");
    expect(text(parsed.visible)).toEqual(["Hello"]);
    expect(parsed.earlier[0]).toMatchObject({ from: "Store Team", email: "team@store.com", date: "Monday, 5 October 2026 09:00" });
    expect(text(parsed.earlier[0].body)).toEqual(["It shipped."]);
  });

  it("folds a signature or a mobile footer from the new words", () => {
    expect(parseMessageBody("Thanks\n-- \nJane Doe\nCEO")).toMatchObject({ earlier: [] });
    expect(text(parseMessageBody("Thanks\n-- \nJane Doe").footer)).toEqual(["--\nJane Doe"]);
    expect(text(parseMessageBody("Thanks\n\nSent from my iPhone").visible)).toEqual(["Thanks"]);
  });

  it("prefers the helpdesk's own stripped copy when it lines up with the body", () => {
    const parsed = parseMessageBody("Is it shipped?\nCould you check please\n\nSome text that is not a header", "Is it shipped? Could you check please");
    expect(text(parsed.visible)).toEqual(["Is it shipped?\nCould you check please"]);
    expect(text(parsed.earlier[0].body)).toEqual(["Some text that is not a header"]);
  });

  it("never hides a message that is all history, and handles empty bodies", () => {
    const parsed = parseMessageBody("> only a quote\n> nothing new");
    expect(text(parsed.visible)).toEqual(["only a quote\nnothing new"]);
    expect(parsed.earlier).toEqual([]);
    expect(parseMessageBody("")).toEqual({ visible: [], footer: [], earlier: [] });
    expect(text(parseMessageBody("a\n\n\n\nb").visible)).toEqual(["a", "b"]);
  });

  it("never drops a short line as a duplicate", () => {
    expect(text(parseMessageBody("Yes\nYes please").visible)).toEqual(["Yes\nYes please"]);
  });
});

describe("readReplyHeader", () => {
  it("splits the date from the name after the time", () => {
    expect(readReplyHeader("On Thu, Sep 24, 2026 at 10:28 PM Fame on Central website@fameoncentral.com wrote: website@fameoncentral.com")).toEqual({
      from: "Fame on Central",
      email: "website@fameoncentral.com",
      date: "Thu, Sep 24, 2026 at 10:28 PM",
    });
    expect(readReplyHeader("Le lun. 5 oct. 2026 à 10:00, Marie Curie <marie@x.fr> a écrit :")).toMatchObject({ from: "Marie Curie", email: "marie@x.fr" });
    expect(senderInitial({ from: "gitty", email: null })).toBe("G");
  });
});

describe("tokenizeLine", () => {
  it("turns markdown links, images, bracketed and bare URLs and emails into tokens", () => {
    expect(tokenizeLine("[www.fameoncentral.com](http://www.fameoncentral.com/)")).toEqual([
      { kind: "link", href: "http://www.fameoncentral.com/", label: "fameoncentral.com", compact: false },
    ]);
    expect(tokenizeLine("See [our size guide](https://store.example.com/pages/size) now")).toEqual([
      { kind: "text", text: "See " },
      { kind: "link", href: "https://store.example.com/pages/size", label: "our size guide", compact: false },
      { kind: "text", text: " now" },
    ]);
    expect(tokenizeLine("![](https://ci3.googleusercontent.com/mail-sig/AIorK4w7-_M5qwRDM)")).toEqual([
      { kind: "image", href: "https://ci3.googleusercontent.com/mail-sig/AIorK4w7-_M5qwRDM", label: "Image" },
    ]);
    expect(tokenizeLine("Go to https://example.com/orders.")).toEqual([
      { kind: "text", text: "Go to " },
      { kind: "link", href: "https://example.com/orders", label: "example.com/orders", compact: true },
      { kind: "text", text: "." },
    ]);
    expect(tokenizeLine("Mindy Bamberger < mindy@gmail.com> wrote")).toEqual([
      { kind: "text", text: "Mindy Bamberger " },
      { kind: "email", href: "mailto:mindy@gmail.com", label: "mindy@gmail.com" },
      { kind: "text", text: " wrote" },
    ]);
    expect(tokenizeLine("(mailto:website@fameoncentral.com)")).toEqual([
      { kind: "email", href: "mailto:website@fameoncentral.com", label: "website@fameoncentral.com" },
    ]);
  });

  it("drops map links but keeps the address, and never links an unsafe scheme", () => {
    expect(tokenizeLine("1381 58th Street (https://www.google.com/maps/search/1381?entry=gmail)")).toEqual([{ kind: "text", text: "1381 58th Street " }]);
    expect(tokenizeLine("[click](javascript:alert(1))").every((t) => t.kind === "text")).toBe(true);
  });
});

describe("shortUrl", () => {
  it("shows the host and a short path, never the query or a tracking token", () => {
    expect(shortUrl("https://www.fameoncentral.com/account/login?utm_campaign=x")).toBe("fameoncentral.com/account/login");
    expect(shortUrl("https://fameoncentral.com/_t/c/v3/AACXYSBghGHqRhyc0rOtEMnfqzfLWsOQ8ZXvqvSJGH7bzxkZ")).toBe("fameoncentral.com");
    expect(shortUrl("https://fameoncentral.com")).toBe("fameoncentral.com");
    expect(shortUrl("https://a.com/one/two/three")).toBe("a.com/one/two/…");
  });
});

describe("attachments", () => {
  it("formats sizes and recognises images and PDFs", () => {
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(2048)).toBe("2 KB");
    expect(formatBytes(3 * 1024 * 1024)).toBe("3.0 MB");
    expect(formatBytes(null)).toBe("");
    expect(attachmentKind("image/png", "x")).toBe("image");
    expect(attachmentKind(null, "receipt.PDF")).toBe("pdf");
    expect(attachmentKind("application/zip", "a.zip")).toBe("file");
  });
});
