const YALE_EMAIL = /^[a-z0-9](?:[a-z0-9._%+-]*[a-z0-9])?@yale\.edu$/;

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

/** True only for a real mailbox at yale.edu. Subdomains and other schools are rejected. */
export function isYaleEmail(email: string) {
  const normalized = normalizeEmail(email);
  if (!YALE_EMAIL.test(normalized)) return false;
  const local = normalized.slice(0, -"@yale.edu".length);
  return !local.includes("..");
}
