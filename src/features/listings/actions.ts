"use server";

import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/features/auth/session";
import { parseListingForm } from "@/features/listings/schema";
import { insertListing } from "@/lib/db/store";

export type ListingActionState = {
  error: string;
  fieldErrors: Record<string, string>;
};

const TYPES: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

export async function createListing(
  _prev: ListingActionState,
  formData: FormData,
): Promise<ListingActionState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/listings/new");

  const parsed = parseListingForm(formData);
  if (!parsed.ok) {
    return { error: parsed.error, fieldErrors: parsed.fieldErrors };
  }

  const files = formData
    .getAll("photos")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);
  if (files.length > 4) {
    return { error: "Add up to four photos.", fieldErrors: { photos: "Four photos maximum." } };
  }

  const photos: string[] = [];
  const folder = path.join(process.cwd(), "public", "uploads");
  await mkdir(folder, { recursive: true });
  for (const file of files) {
    const extension = TYPES[file.type];
    if (!extension) {
      return {
        error: "Photos need to be JPG, PNG, WEBP, or GIF.",
        fieldErrors: { photos: "Use JPG, PNG, WEBP, or GIF." },
      };
    }
    if (file.size > 2_000_000) {
      return { error: "Each photo needs to be under 2 MB.", fieldErrors: { photos: "Under 2 MB each." } };
    }
    const filename = `${randomUUID()}${extension}`;
    const bytes = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(folder, filename), bytes);
    photos.push(`/uploads/${filename}`);
  }

  const created = await insertListing({ ...parsed.data, sellerId: user.id, photos });
  if (!created.ok) return { error: created.error, fieldErrors: {} };

  revalidatePath("/");
  revalidatePath("/browse");
  revalidatePath("/move-out");
  revalidatePath(`/profile/${user.id}`);
  redirect(`/listings/${created.listing.id}`);
}
