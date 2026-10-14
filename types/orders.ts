export type OrderStatus = "paid" | "pending" | "refunded";

export interface RecentOrder {
  id: string;
  /** Shopify order number, e.g. "#1058". */
  number: string;
  customerName: string;
  total: number;
  status: OrderStatus;
  /** ISO timestamp. */
  createdAt: string;
}

/** Order detail drawer (SPEC-061, backend SPEC-055). */
export interface OrderLineItem {
  id: number;
  productId: number | null;
  variantId: number | null;
  title: string;
  variantTitle: string | null;
  sku: string | null;
  quantity: number;
  price: number;
  totalDiscount: number;
  /** The product's CURRENT image, if it still exists — not necessarily what
   * shipped with the order. */
  imageUrl: string | null;
}

export interface OrderDiscountCode {
  code: string;
  amount: number | null;
  valueType: string | null;
}

export interface OrderRefund {
  id: number;
  note: string | null;
  totalRefunded: number;
  /** ISO timestamp. */
  createdAt: string;
}

export interface OrderCustomerSummary {
  name: string | null;
  email: string | null;
  ordersCount: number;
  totalSpent: number;
}

export interface OrderDetail {
  id: number;
  name: string;
  financialStatus: string;
  fulfillmentStatus: string | null;
  currency: string;
  subtotalPrice: number;
  totalDiscounts: number;
  totalTax: number;
  totalPrice: number;
  sourceName: string | null;
  locationId: number | null;
  locationName: string | null;
  /** ISO timestamps. */
  createdAt: string;
  updatedAt: string;
  processedAt: string | null;
  cancelledAt: string | null;
  closedAt: string | null;
  customer: OrderCustomerSummary | null;
  lineItems: OrderLineItem[];
  discountCodes: OrderDiscountCode[];
  refunds: OrderRefund[];
}
