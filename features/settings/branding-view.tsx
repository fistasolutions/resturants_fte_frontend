"use client";

import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

import { BrandingSkeleton } from "@/features/settings/settings-skeletons";
import { QueryErrorState } from "@/components/shared/query-error-state";
import { BrandColorCard } from "@/features/settings/brand-color-card";
import { LoginLinkCard } from "@/features/settings/login-link-card";
import { LoginMediaCard } from "@/features/settings/login-media-card";
import { LogoCard } from "@/features/settings/logo-card";
import { useApiQuery } from "@/hooks/use-api-query";
import type { Branding, LogoVariant } from "@/lib/branding";
import { brandingQueries } from "@/lib/queries/branding";
import { teamQueries } from "@/lib/queries/team";
import { can } from "@/lib/team";
import {
  clearBrandColor,
  clearLoginMedia,
  removeLogo,
  setBrandColor,
  setLoginMedia,
  uploadLogo,
} from "@/services/branding";

const VARIANTS: LogoVariant[] = ["light", "dark"];

/**
 * Settings → Branding (SPEC-317): the organization's two logos, its brand colour (SPEC-322) and
 * its login screen. The reads start in parallel (prefetched by the page). A write puts the
 * backend's answer straight into the cache and refreshes the router, so the sidebar's logo and
 * the brand colour (both from the layout's workspace read) change without a reload.
 */
export function BrandingView() {
  const branding = useApiQuery(brandingQueries.current());
  const access = useApiQuery(teamQueries.access());
  const queryClient = useQueryClient();
  const router = useRouter();

  const failed = branding.error ?? access.error;
  if (failed) {
    return (
      <QueryErrorState
        error={failed}
        onRetry={() => void Promise.all([branding.refetch(), access.refetch()])}
      />
    );
  }
  if (!branding.data || !access.data) return <BrandingSkeleton />;

  const current = branding.data;
  const canManage = can(access.data, "settings.manage");

  function saved(next: Branding) {
    queryClient.setQueryData(brandingQueries.current().queryKey, next);
    router.refresh();
  }

  /** A new or removed logo changes the colours suggested from it. */
  function logoSaved(next: Branding) {
    saved(next);
    void queryClient.invalidateQueries({ queryKey: brandingQueries.palette().queryKey });
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      <LoginLinkCard slug={current.slug} />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {VARIANTS.map((variant) => (
          <LogoCard
            key={variant}
            variant={variant}
            url={current.logo[variant]}
            canManage={canManage}
            onUpload={async (file) => logoSaved(await uploadLogo(variant, file))}
            onRemove={async () => logoSaved(await removeLogo(variant))}
          />
        ))}
      </div>
      <BrandColorCard
        // A saved colour starts the card afresh from what is stored.
        key={current.color?.hex ?? "none"}
        saved={current.color}
        hasLogo={current.logo.light !== null || current.logo.dark !== null}
        canManage={canManage}
        onSave={async (hex, source) => saved(await setBrandColor(hex, source))}
        onReset={async () => saved(await clearBrandColor())}
      />
      <LoginMediaCard
        login={current.login}
        canManage={canManage}
        onSave={async (kind, files, poster) => saved(await setLoginMedia(kind, files, poster))}
        onClear={async () => saved(await clearLoginMedia())}
      />
      {!canManage ? (
        <p className="text-xs text-muted-foreground">
          Your role can see the branding but not change it — an owner or admin can.
        </p>
      ) : null}
    </div>
  );
}
