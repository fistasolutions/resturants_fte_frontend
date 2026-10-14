/** Phase 1 mock fixtures — swapped for the real API in Phase 8. */
import { DEMO_EMAIL } from "@/lib/mock/credentials";
import type { StoreConnection, SystemStatus, UserProfile } from "@/types/store";

export const mockStoreConnection: StoreConnection = {
  name: "Example Store",
  domain: "examplestore.com",
  status: "active",
  lastSyncAt: "2026-05-15T10:15:00Z",
};

export const mockCurrentUser: UserProfile = {
  name: "Admin",
  email: DEMO_EMAIL,
};

export const mockSystemStatus: SystemStatus = {
  apiStatus: "operational",
  lastSyncAt: "2026-05-15T10:15:00Z",
  syncSchedule: "Every 15 minutes",
  appVersion: "Phase 1 preview",
};
