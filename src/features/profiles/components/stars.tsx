import { Star } from "lucide-react";

import { formatRating } from "@/lib/format";

export function Stars({ rating, count }: { rating: number | null; count?: number }) {
  if (rating == null) {
    return <span className="text-sm text-muted-foreground">New seller</span>;
  }
  const rounded = Math.round(rating);
  const label = formatRating(rating);
  return (
    <span className="inline-flex items-center gap-1.5 text-sm" aria-label={`${label} out of 5`}>
      <span className="inline-flex items-center gap-0.5">
        {Array.from({ length: 5 }, (_, index) => (
          <Star
            key={index}
            aria-hidden
            className={
              index < rounded ? "size-3.5 fill-brass text-brass" : "size-3.5 text-border"
            }
          />
        ))}
      </span>
      <span className="font-medium text-foreground">{label}</span>
      {typeof count === "number" ? (
        <span className="text-muted-foreground">
          ({count} review{count === 1 ? "" : "s"})
        </span>
      ) : null}
    </span>
  );
}
