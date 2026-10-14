/** Microsoft Clarity queries (backend SPEC-219 / frontend SPEC-214) — defined once
 * for both transports (SPEC-230). Byte-identical paths to `services/clarity.ts`. */
import {
  adaptClarityBlogEngagement,
  adaptClarityBrokeYesterday,
  adaptClarityCampaigns,
  adaptClarityFriction,
  adaptClarityFrictionDetail,
  adaptClarityStatus,
} from "@/lib/adapters";
import { defineQuery } from "@/lib/query-def";
import type {
  ClarityBlogEngagement,
  ClarityBrokeYesterday,
  ClarityCampaigns,
  ClarityFriction,
  ClarityFrictionDetail,
  ClarityStatus,
} from "@/types/clarity";

type Payload = Record<string, unknown>;

export const clarityPaths = {
  status: (): string => "/clarity/status",
  blogEngagement: (): string => "/clarity/blog-engagement",
  friction: (): string => "/clarity/friction",
  frictionPage: (handle: string): string => `/clarity/friction/${encodeURIComponent(handle)}`,
  brokeYesterday: (): string => "/clarity/broke-yesterday",
  campaigns: (): string => "/clarity/campaigns",
} as const;

export const clarityQueries = {
  status: () =>
    defineQuery<ClarityStatus>(["clarity", "status"], async (api) =>
      adaptClarityStatus(await api<Payload>(clarityPaths.status())),
    ),
  blogEngagement: () =>
    defineQuery<ClarityBlogEngagement>(["clarity", "blog-engagement"], async (api) =>
      adaptClarityBlogEngagement(await api<Payload>(clarityPaths.blogEngagement())),
    ),
  friction: () =>
    defineQuery<ClarityFriction>(["clarity", "friction"], async (api) =>
      adaptClarityFriction(await api<Payload>(clarityPaths.friction())),
    ),
  frictionPage: (handle: string) =>
    defineQuery<ClarityFrictionDetail>(["clarity", "friction", handle], async (api) =>
      adaptClarityFrictionDetail(await api<Payload>(clarityPaths.frictionPage(handle))),
    ),
  brokeYesterday: () =>
    defineQuery<ClarityBrokeYesterday>(["clarity", "broke-yesterday"], async (api) =>
      adaptClarityBrokeYesterday(await api<Payload>(clarityPaths.brokeYesterday())),
    ),
  campaigns: () =>
    defineQuery<ClarityCampaigns>(["clarity", "campaigns"], async (api) =>
      adaptClarityCampaigns(await api<Payload>(clarityPaths.campaigns())),
    ),
} as const;
