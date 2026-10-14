/** Phase 1 mock fixtures — swapped for the real AI agent API in Phase 8. */
import type { ChatConversation, SuggestedPrompt } from "@/types/chat";

export const mockSuggestedPrompts: SuggestedPrompt[] = [
  { id: "prompt_sales_yesterday", label: "What were yesterday's sales?" },
  { id: "prompt_top_products", label: "Top 10 products by revenue" },
  { id: "prompt_low_stock", label: "Which products are low in stock?" },
  { id: "prompt_big_spenders", label: "Customers who spent over $500" },
  { id: "prompt_inventory_location", label: "Show inventory by location" },
];

const salesSummaryReply = `Here's how **yesterday (May 15, 2026)** performed:

- Revenue: **$24,130.50** — up **12.5%** vs May 14
- Orders: **214** — up **8.3%**
- Average Order Value: **$112.77** — up **3.6%**
- New customers: **68** (↑ 14.7%) · Returning: **34.2%**

A strong day — both order volume and basket size grew, so the Summer Sale is lifting more than just traffic.`;

/** Canned assistant replies (Markdown) keyed by suggested-prompt id. */
export const mockAssistantReplies: Record<string, string> = {
  prompt_sales_yesterday: salesSummaryReply,
  prompt_top_products: `Your **top products by revenue** for May 15, 2026:

| # | Product | Revenue | Orders |
| --- | --- | --- | --- |
| 1 | Premium Hoodie | **$4,250.50** | 212 |
| 2 | Classic T-Shirt | $3,120.00 | 156 |
| 3 | Leather Wallet | $2,890.75 | 98 |
| 4 | Sneaker Pro | $2,540.00 | 74 |
| 5 | Cap Collection | $1,980.25 | 65 |

The Premium Hoodie alone drives **17.6%** of the day's revenue — worth protecting its stock level.`,
  prompt_low_stock: `Current **inventory alerts**:

- **12 variants** are low in stock — most urgent: Leather Wallet (Brown, 6 left) and Silk Scarf (Crimson, 3 left)
- **5 variants** are out of stock, including two Sneaker Pro sizes (60 units incoming)

Open **Inventory** for the full list with per-location levels.`,
  prompt_big_spenders: `**High-value customers** are computed by the backend analytics engine and unlock once your store data sync is connected (Phase 8).

Until then, the **Customers** page shows lifetime spend per customer from the preview data.`,
  prompt_inventory_location: `**Inventory by location** is computed by the backend analytics engine and unlocks once your store data sync is connected (Phase 8).

Until then, the **Inventory** page lists preview stock levels per location.`,
};

export const mockFallbackReply = [
  "I'm running on preview data right now, so I can only answer the suggested",
  "questions. Once your store sync is connected, I'll answer anything about",
  "your sales, products, customers, and inventory.",
].join(" ");

/** First-visit chat history seeds — deletable like any conversation. */
export const mockSeedConversations: ChatConversation[] = [
  {
    id: "seed_sales_yesterday",
    title: "What were yesterday's sales?",
    createdAt: "2026-05-15T09:30:00.000Z",
    updatedAt: "2026-05-15T09:30:20.000Z",
    messages: [
      {
        id: "seed_sales_q",
        role: "user",
        content: "What were yesterday's sales?",
        createdAt: "2026-05-15T09:30:00.000Z",
      },
      {
        id: "seed_sales_a",
        role: "assistant",
        content: mockAssistantReplies.prompt_sales_yesterday,
        createdAt: "2026-05-15T09:30:20.000Z",
      },
    ],
  },
  {
    id: "seed_low_stock",
    title: "Which products are low in stock?",
    createdAt: "2026-05-14T18:04:00.000Z",
    updatedAt: "2026-05-14T18:04:15.000Z",
    messages: [
      {
        id: "seed_stock_q",
        role: "user",
        content: "Which products are low in stock?",
        createdAt: "2026-05-14T18:04:00.000Z",
      },
      {
        id: "seed_stock_a",
        role: "assistant",
        content: mockAssistantReplies.prompt_low_stock,
        createdAt: "2026-05-14T18:04:15.000Z",
      },
    ],
  },
];
