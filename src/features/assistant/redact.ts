/** Strip bearer tokens and any copy of a known secret before text can leave the server. */
export function redactSecrets(text: string, secrets: readonly string[] = []): string {
  let out = text.replace(/Bearer\s+\S+/gi, "Bearer [redacted]");
  out = out.replace(/\b(?:xai|sk)-[A-Za-z0-9_-]{6,}\b/g, "[redacted]");
  for (const secret of secrets) {
    if (secret.length >= 4) out = out.split(secret).join("[redacted]");
  }
  return out;
}

export function containsSecret(value: unknown, secret: string | null): boolean {
  if (!secret || secret.length < 4) return false;
  return JSON.stringify(value).includes(secret);
}

const MODEL = /^[A-Za-z0-9._:-]{1,80}$/;

export function sanitizeModel(value: string | undefined | null): string {
  if (typeof value !== "string") return "grok-4";
  const trimmed = value.trim();
  return MODEL.test(trimmed) ? trimmed : "grok-4";
}
