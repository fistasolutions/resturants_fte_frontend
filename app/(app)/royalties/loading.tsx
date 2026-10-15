import { RestaurantSkeleton } from "@/features/restaurant/parts";

/** Content-only skeleton (SPEC-232): the shell's header and tabs stay painted. */
export default function Loading() {
  return <RestaurantSkeleton />;
}
