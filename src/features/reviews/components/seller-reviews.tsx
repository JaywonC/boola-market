import Link from "next/link";
import { connection } from "next/server";

import { getCurrentUser } from "@/features/auth/session";
import { openReviews } from "@/features/reviews/eligibility";
import { ReviewForm } from "@/features/reviews/components/review-form";
import { ReviewList } from "@/features/reviews/components/review-list";
import type { Review, User } from "@/lib/db/types";
import { readStoreForRender } from "@/lib/db/store";
import { formatRating } from "@/lib/format";

export async function SellerReviews({
  sellerId,
  rating,
  reviewCount,
  reviews,
}: {
  sellerId: string;
  rating: number | null;
  reviewCount: number;
  reviews: Array<Review & { reviewer: User; listingTitle: string }>;
}) {
  await connection();
  const viewer = await getCurrentUser();
  const store = await readStoreForRender();
  const opportunities = viewer
    ? openReviews({
        orders: store.orders,
        reviews: store.reviews,
        listings: store.listings,
        buyerId: viewer.id,
        sellerId,
      })
    : [];
  const summary =
    rating == null
      ? "No rating yet"
      : `${formatRating(rating)} average from ${reviewCount} review${reviewCount === 1 ? "" : "s"}`;

  return (
    <section className="mt-10">
      <h2 className="font-serif text-3xl text-yale">Reviews from buyers</h2>
      <p className="mt-1 text-sm text-muted-foreground">{summary}</p>
      {opportunities.length > 0 ? (
        <div className="mt-4 space-y-3">
          {opportunities.map((opportunity) => (
            <ReviewForm key={opportunity.orderId} opportunity={opportunity} />
          ))}
        </div>
      ) : viewer?.id === sellerId ? (
        <p className="mt-3 text-sm text-muted-foreground">
          Buyers leave a rating and a short note here after a sale is completed.
        </p>
      ) : viewer ? (
        <p className="mt-3 text-sm text-muted-foreground">
          Only a buyer with a completed order can review this seller.
        </p>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">
          <Link href={`/login?next=/profile/${sellerId}`} className="font-medium text-yale hover:underline">
            Sign in
          </Link>{" "}
          to review this seller after a completed purchase.
        </p>
      )}
      <ReviewList reviews={reviews} />
    </section>
  );
}
