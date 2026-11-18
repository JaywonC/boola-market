import { connection } from "next/server";

import { getCurrentUser } from "@/features/auth/session";
import { openReviews } from "@/features/reviews/eligibility";
import { ReviewForm } from "@/features/reviews/components/review-form";
import { readStoreForRender } from "@/lib/db/store";

/** Shown on a listing when the signed-in buyer completed that sale and has not reviewed it. */
export async function ListingReviewPrompt({ listingId }: { listingId: string }) {
  await connection();
  const viewer = await getCurrentUser();
  if (!viewer) return null;
  const store = await readStoreForRender();
  const opportunities = openReviews({
    orders: store.orders,
    reviews: store.reviews,
    listings: store.listings,
    buyerId: viewer.id,
    listingId,
  });
  if (opportunities.length === 0) return null;
  return (
    <div className="mt-4 space-y-3">
      {opportunities.map((opportunity) => (
        <ReviewForm key={opportunity.orderId} opportunity={opportunity} />
      ))}
    </div>
  );
}
