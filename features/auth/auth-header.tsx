/** The title block every auth screen opens with. */
export function AuthHeader({ title, subtitle }: { title: string; subtitle: React.ReactNode }) {
  return (
    <header className="space-y-1.5">
      <h1 className="font-heading text-3xl tracking-wide">{title}</h1>
      <p className="text-sm text-muted-foreground">{subtitle}</p>
    </header>
  );
}
