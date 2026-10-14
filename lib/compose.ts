/** Pure helpers for the compose pages (SPEC-066). */

export interface ComposeValidationErrors {
  subject?: string;
  body?: string;
}

export function slugify(text: string): string {
  const slug = text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "location";
}

export function attachmentFilename(prefix: string, locationName: string): string {
  return `${prefix}-${slugify(locationName)}.csv`;
}

/** Client-side boundary validation. The API remains authoritative, but an
 * accidental blank email should never need a network round trip. */
export function validateComposeMessage(subject: string, body: string): ComposeValidationErrors {
  const errors: ComposeValidationErrors = {};
  if (!subject.trim()) errors.subject = "Add a subject before sending.";
  if (!body.trim()) errors.body = "Write a message before sending.";
  return errors;
}
