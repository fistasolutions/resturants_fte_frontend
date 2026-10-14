/** "or" between the providers and the email form. */
export function AuthDivider() {
  return (
    <div className="flex items-center gap-3 text-xs text-muted-foreground" role="separator">
      <span className="h-px flex-1 bg-border" aria-hidden />
      or
      <span className="h-px flex-1 bg-border" aria-hidden />
    </div>
  );
}
