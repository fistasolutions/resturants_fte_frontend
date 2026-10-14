import { Skeleton } from "@/components/ui/skeleton";

/**
 * Content-only skeleton for the Orders tabs (SPEC-087). The header, tab bar, and
 * filters row live in the persistent shell (`OrdersShell`) and stay painted
 * across a tab switch, so this fallback fills only the table area below them —
 * the tab bar no longer blinks out on navigation.
 */
export default function OrdersLoading() {
  return <Skeleton className="h-96 rounded-2xl" />;
}
