"use client";

import { Sparkles } from "lucide-react";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { writeListingWithGrok } from "@/features/assistant/actions";
import type { ListingDraft } from "@/features/assistant/types";
import { CATEGORY_LABELS, CONDITION_LABELS } from "@/lib/categories";
import { formatMoney } from "@/lib/format";

export function ListingAssistantSlot({
  onApply,
  photoError,
}: {
  onApply: (draft: ListingDraft) => void;
  photoError?: string;
}) {
  const photosRef = useRef<HTMLInputElement>(null);
  const [notes, setNotes] = useState("");
  const [photoName, setPhotoName] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState<ListingDraft | null>(null);

  function onPhotoChange() {
    const file = photosRef.current?.files?.[0] ?? null;
    setPhotoName(file?.name ?? "");
    setPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return file ? URL.createObjectURL(file) : null;
    });
  }

  async function onWrite() {
    const file = photosRef.current?.files?.[0] ?? null;
    if (!notes.trim() && !file) {
      setError("Add a photo or a few words first.");
      return;
    }
    const body = new FormData();
    body.set("notes", notes);
    if (file) body.set("photo", file);
    setPending(true);
    setError("");
    try {
      const result = await writeListingWithGrok(body);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setDraft(result.draft);
      onApply(result.draft);
    } catch {
      setError("Couldn’t reach the assistant. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="rounded-2xl border border-yale/15 bg-card p-4" aria-busy={pending}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-serif text-2xl text-yale">Write it with Grok</h2>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            Add a photo, a few words, or both. Grok drafts the title, description, category, condition, and a fair price from similar listings.
          </p>
        </div>
        <p className="inline-flex items-center gap-1.5 rounded-full bg-yale px-2.5 py-1 text-xs font-medium text-primary-foreground">
          <Sparkles className="size-3.5" aria-hidden />
          Powered by Grok
        </p>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-[180px_minmax(0,1fr)]">
        <div className="space-y-2">
          <Label htmlFor="photos">Listing photo</Label>
          <label
            htmlFor="photos"
            className="flex aspect-[4/3] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border border-dashed border-border bg-background text-center"
          >
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- local object URL from the seller’s file
              <img src={previewUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="px-3 text-xs text-muted-foreground">Add a photo of the thing</span>
            )}
          </label>
          <input
            ref={photosRef}
            id="photos"
            name="photos"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            onChange={onPhotoChange}
            className="block w-full text-xs text-muted-foreground file:mr-2 file:rounded-md file:border-0 file:bg-secondary file:px-2 file:py-1 file:text-xs file:font-medium file:text-secondary-foreground"
          />
          <p className="text-xs text-muted-foreground">
            {photoName ? `${photoName}. ` : ""}
            This photo is what buyers see. Up to four images, 2 MB each.
          </p>
          {photoError ? <p className="text-sm text-destructive">{photoError}</p> : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="assistant-notes">A few words</Label>
          <Textarea
            id="assistant-notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={4}
            placeholder="Harvard–Yale student ticket, or a mini fridge from Pierson"
            className="min-h-24 bg-background"
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button type="button" onClick={onWrite} disabled={pending} className="h-10 px-4">
          <Sparkles className="size-4" aria-hidden />
          {pending ? "Writing…" : "Write it with Grok"}
        </Button>
        <p className="text-xs text-muted-foreground">You can edit every field before you publish.</p>
      </div>

      {error ? (
        <p role="alert" className="mt-3 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {draft ? (
        <div role="status" aria-live="polite" className="mt-3 rounded-xl border border-brass/40 bg-paper px-3 py-3 text-sm">
          <p className="font-medium text-yale">
            Suggested {formatMoney(draft.priceCents)}
            <span className="ml-2 font-normal text-muted-foreground">
              {CATEGORY_LABELS[draft.category]} · {CONDITION_LABELS[draft.condition]}
              {draft.source === "mock" ? " · demo draft" : ""}
            </span>
          </p>
          <p className="mt-1">{draft.price.rationale}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            {draft.source === "mock"
              ? "Powered by Grok in demo mode: no server API key is set, so this draft uses listings already on campus. The form below is filled in."
              : "Powered by Grok. The form below is filled in — change anything, then publish."}
          </p>
        </div>
      ) : null}
    </section>
  );
}
