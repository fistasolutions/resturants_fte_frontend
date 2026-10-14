/** Pure email-format validation, used by the per-location manager email
 * card (SPEC-057) — the store-wide comma-list this originally served
 * (parseEmails/serializeEmails/isDuplicateEmail) was removed along with it. */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_PATTERN.test(email);
}
