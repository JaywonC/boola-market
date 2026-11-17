import "server-only";

import { sanitizeModel } from "@/features/assistant/redact";

/**
 * The only place XAI_API_KEY is read.
 * Imported by the listing server action. `server-only` fails the build if a
 * client component imports this file, and the value is never returned.
 */
export function readXaiApiKey(): string | null {
  const raw = process.env.XAI_API_KEY;
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!trimmed || /[\r\n]/.test(trimmed)) return null;
  return trimmed;
}

export function readXaiModel(): string {
  return sanitizeModel(process.env.XAI_MODEL);
}
