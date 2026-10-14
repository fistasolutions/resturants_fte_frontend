/**
 * Client-side form validation. Server-side validation remains authoritative
 * once the real auth API lands (Phase 8) — these exist for immediate feedback.
 * Each validator returns an error message, or null when valid.
 */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const PASSWORD_MIN_LENGTH = 8;

export function validateEmail(value: string): string | null {
  const email = value.trim();
  if (!email) return "Email is required.";
  if (!EMAIL_PATTERN.test(email)) return "Enter a valid email address.";
  return null;
}

export function validatePassword(value: string): string | null {
  if (!value) return "Password is required.";
  if (value.length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`;
  }
  return null;
}

export function validateName(value: string): string | null {
  const name = value.trim();
  if (!name) return "Name is required.";
  if (name.length < 2) return "Name must be at least 2 characters.";
  return null;
}

export function validatePasswordConfirmation(
  password: string,
  confirmation: string,
): string | null {
  if (!confirmation) return "Confirm your password.";
  if (password !== confirmation) return "Passwords do not match.";
  return null;
}
