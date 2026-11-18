import Link from "next/link";

import { Stars } from "@/features/profiles/components/stars";
import type { Review, User } from "@/lib/db/types";
import { classYear, formatDate } from "@/lib/format";

export function ReviewList({
  reviews,
}: {
  reviews: Array<Review & { reviewer: User; listingTitle: string }>;
}) {
  if (reviews.length === 0) {
    return (
      <p className="mt-3 text-sm text-muted-foreground">
        No written reviews yet. A rating appears here after a completed sale.
      </p>
    );
  }

  return (
    <ul className="mt-4 space-y-3">
      {reviews.map((review) => (
        <li key={review.id} className="rounded-xl border border-border bg-card p-4">
          <Stars rating={review.rating} />
          <p className="mt-2 text-sm leading-6">{review.body}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            <Link href={`/profile/${review.reviewer.id}`} className="font-medium text-foreground hover:underline">
              {review.reviewer.name}
            </Link>
            {" · "}
            {review.reviewer.college} {classYear(review.reviewer.graduationYear)}
            {" · "}
            {review.listingTitle}
            {" · "}
            {formatDate(review.createdAt)}
          </p>
        </li>
      ))}
    </ul>
  );
}
