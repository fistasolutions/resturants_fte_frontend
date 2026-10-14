interface FieldErrorProps {
  id: string;
  message: string | null;
}

/** Inline field error, referenced by the input's aria-describedby. */
export function FieldError({ id, message }: FieldErrorProps) {
  if (!message) return null;
  return (
    <p id={id} className="text-xs text-destructive">
      {message}
    </p>
  );
}
