import { RestaurantSkeleton } from "@/features/restaurant/parts";

/** Content-only skeleton (SPEC-232): the shell's header stays painted. */
export default function Loading() {
  return <RestaurantSkeleton tiles={0} />;
}
