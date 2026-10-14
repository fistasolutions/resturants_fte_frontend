/** A form-level message: an error the backend gave, or a quiet note. */
export function FormAlert({
  message,
  tone = "error",
}: {
  message: string | null;
  tone?: "error" | "note";
}) {
  if (!message) return null;
  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={tone === "error" ? "text-sm text-destructive" : "text-sm text-muted-foreground"}
    >
      {message}
    </p>
  );
}
