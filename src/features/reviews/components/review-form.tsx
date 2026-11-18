"use client";

import { Star } from "lucide-react";
import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { submitSellerReview, type ReviewFormState } from "@/features/reviews/actions";
import type { ReviewOpportunity } from "@/features/reviews/eligibility";
import { REVIEW_MAX_LENGTH, REVIEW_MIN_LENGTH } from "@/features/reviews/rules";
import { formatDate, formatMoney } from "@/lib/format";

const initial: ReviewFormState = { error: "", done: false };

export function ReviewForm({ opportunity }: { opportunity: ReviewOpportunity }) {
  const [state, action, pending] = useActionState(submitSellerReview, initial);
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState<number | null>(null);
  const [body, setBody] = useState("");
  const shown = hover ?? rating;

  if (state.done) {
    return (
      <p className="rounded-xl border border-yale/20 bg-secondary px-4 py-3 text-sm text-yale" role="status">
        Review posted. It now counts toward this seller’s rating.
      </p>
    );
  }

  return (
    <form action={action} className="rounded-xl border border-brass/40 bg-card p-4">
      <h3 className="font-serif text-xl text-yale">Review this sale</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        {opportunity.listingTitle} · {formatMoney(opportunity.priceCents)} · completed{" "}
        {formatDate(opportunity.completedAt)}
      </p>
      {state.error ? (
        <p role="alert" className="mt-3 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
      <input type="hidden" name="orderId" value={opportunity.orderId} />
      <fieldset className="mt-4">
        <legend className="text-sm font-medium">Rating</legend>
        <div className="mt-2 flex items-center gap-1" onMouseLeave={() => setHover(null)}>
          {[1, 2, 3, 4, 5].map((value) => (
            <label key={value} className="cursor-pointer rounded-md p-0.5">
              <input
                type="radio"
                name="rating"
                value={value}
                checked={rating === value}
                onChange={() => setRating(value)}
                onFocus={() => setHover(value)}
                className="sr-only"
                required
              />
              <Star
                aria-hidden
                className={value <= shown ? "size-6 fill-brass text-brass" : "size-6 text-border"}
                onMouseEnter={() => setHover(value)}
              />
              <span className="sr-only">
                {value} star{value === 1 ? "" : "s"}
              </span>
            </label>
          ))}
          <span className="ml-1 text-sm text-muted-foreground">{rating} / 5</span>
        </div>
      </fieldset>
      <div className="mt-4 space-y-2">
        <Label htmlFor={`review-body-${opportunity.orderId}`}>What should the next buyer know?</Label>
        <Textarea
          id={`review-body-${opportunity.orderId}`}
          name="body"
          required
          minLength={REVIEW_MIN_LENGTH}
          maxLength={REVIEW_MAX_LENGTH}
          rows={4}
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder="Met at Cross Campus, the item matched the listing, and the handoff took five minutes."
          className="min-h-24 bg-background"
          aria-invalid={Boolean(state.error)}
        />
        <p className="text-xs text-muted-foreground">
          {body.trim().length}/{REVIEW_MAX_LENGTH} · a sentence or two is enough
        </p>
      </div>
      <Button type="submit" disabled={pending} className="mt-4 h-10 px-4">
        {pending ? "Publishing…" : "Publish review"}
      </Button>
    </form>
  );
}
