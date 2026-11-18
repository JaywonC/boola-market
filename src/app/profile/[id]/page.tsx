import { notFound } from "next/navigation";
import { Suspense } from "react";

import { DetailSkeleton } from "@/components/layout/skeletons";
import { ListingGrid } from "@/features/listings/components/listing-card";
import { Person } from "@/features/profiles/components/person";
import { Stars } from "@/features/profiles/components/stars";
import { SellerReviews } from "@/features/reviews/components/seller-reviews";
import { VerifiedYalie } from "@/features/reviews/components/verified-yalie";
import { getProfile } from "@/lib/db/queries";
import { formatDate } from "@/lib/format";

export default function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<DetailSkeleton />}>
      <ProfileBody params={params} />
    </Suspense>
  );
}

async function ProfileBody({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await getProfile(id);
  if (!profile) notFound();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <section className="rounded-2xl border border-border bg-card p-6">
        <Person
          user={profile.user}
          rating={profile.rating}
          reviewCount={profile.reviewCount}
          sales={profile.completedSales}
          large
        />
        <VerifiedYalie college={profile.user.college} graduationYear={profile.user.graduationYear} />
        <dl className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div>
            <dt className="text-xs tracking-wide text-muted-foreground uppercase">Rating</dt>
            <dd className="mt-1">
              <Stars rating={profile.rating} count={profile.reviewCount} />
            </dd>
          </div>
          <div>
            <dt className="text-xs tracking-wide text-muted-foreground uppercase">Completed sales</dt>
            <dd className="mt-1 font-serif text-3xl text-yale">{profile.completedSales}</dd>
          </div>
          <div>
            <dt className="text-xs tracking-wide text-muted-foreground uppercase">On Yale Marketplace</dt>
            <dd className="mt-1 text-sm">{formatDate(profile.user.createdAt)}</dd>
          </div>
        </dl>
        <p className="mt-4 text-sm text-muted-foreground">{profile.user.email}</p>
      </section>

      <SellerReviews
        sellerId={profile.user.id}
        rating={profile.rating}
        reviewCount={profile.reviewCount}
        reviews={profile.reviews}
      />

      <section className="mt-10">
        <h2 className="font-serif text-3xl text-yale">Listings</h2>
        <div className="mt-4">
          {profile.listings.length === 0 ? (
            <p className="text-sm text-muted-foreground">No listings yet.</p>
          ) : (
            <ListingGrid cards={profile.listings} />
          )}
        </div>
      </section>
    </div>
  );
}
