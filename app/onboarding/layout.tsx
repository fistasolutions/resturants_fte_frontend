import { ThemeToggle } from "@/components/layout/theme-toggle";
import { BrandLogo } from "@/components/shared/brand-logo";
import { SignOutButton } from "@/features/onboarding/sign-out-button";

export default function OnboardingLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="flex h-14 items-center justify-between border-b px-4">
        <BrandLogo size="sm" className="text-foreground" />
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <SignOutButton />
        </div>
      </header>
      <main className="flex flex-1 justify-center p-4 py-12">
        <div className="w-full max-w-md space-y-8">{children}</div>
      </main>
    </div>
  );
}
