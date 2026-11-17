"use server";

import { getCurrentUser } from "@/features/auth/session";
import { createDraft } from "@/features/assistant/draft";
import { readXaiApiKey, readXaiModel } from "@/features/assistant/env.server";
import { containsSecret } from "@/features/assistant/redact";
import type { AssistantResult } from "@/features/assistant/types";
import { readStore } from "@/lib/db/store";

const PHOTO_TYPES: Record<string, string> = {
  "image/jpeg": "image/jpeg",
  "image/png": "image/png",
  "image/webp": "image/webp",
  "image/gif": "image/gif",
};

export async function writeListingWithGrok(formData: FormData): Promise<AssistantResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, error: "Sign in with your @yale.edu address first." };
  }

  const notes = String(formData.get("notes") ?? "");
  const photo = await readPhoto(formData.get("photo"));
  if (!photo.ok) return photo;

  let listings;
  try {
    const store = await readStore();
    listings = store.listings;
  } catch {
    return { ok: false, error: "Couldn’t read campus listings to price this. Try again." };
  }

  const apiKey = readXaiApiKey();
  const result = await createDraft({
    notes,
    hasPhoto: Boolean(photo.image),
    image: photo.image,
    listings,
    apiKey,
    model: readXaiModel(),
  });

  if (!result.ok) return { ok: false, error: result.error };
  if (containsSecret(result.draft, apiKey)) {
    return { ok: false, error: "The draft was discarded because it included a secret." };
  }
  return { ok: true, draft: result.draft };
}

async function readPhoto(
  entry: FormDataEntryValue | null,
): Promise<{ ok: true; image: { mime: string; base64: string } | null } | { ok: false; error: string }> {
  if (!(entry instanceof File) || entry.size === 0) return { ok: true, image: null };
  const mime = PHOTO_TYPES[entry.type];
  if (!mime) return { ok: false, error: "Use a JPG, PNG, WEBP, or GIF." };
  if (entry.size > 2_000_000) return { ok: false, error: "That photo needs to be under 2 MB." };
  const bytes = Buffer.from(await entry.arrayBuffer());
  return { ok: true, image: { mime, base64: bytes.toString("base64") } };
}
