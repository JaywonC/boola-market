import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DetailSkeleton } from "@/components/layout/skeletons";
import { getCurrentUser } from "@/features/auth/session";
import { BidList } from "@/features/auctions/components/bid-list";
import { ListingArt } from "@/features/listings/components/listing-art";
import { ThreadPreview } from "@/features/messages/components/thread-preview";
import { Person } from "@/features/profiles/components/person";
import { categoryLabel, CONDITION_LABELS } from "@/lib/categories";
import { getListingDetail } from "@/lib/db/queries";
import { formatAuctionEnd, formatDate, formatMoney } from "@/lib/format";

export default function ListingPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<DetailSkeleton />}>
      <ListingBody params={params} />
    </Suspense>
  );
}

async function ListingBody({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await getListingDetail(id);
  if (!detail) notFound();
  const viewer = await getCurrentUser();
  const { listing } = detail;
  const price =
    listing.listingType === "auction"
      ? detail.highBidCents
        ? formatMoney(detail.highBidCents)
        : formatMoney(listing.priceCents)
      : formatMoney(listing.priceCents);

  return (
    <article className="mx-auto grid max-w-6xl gap-8 px-4 py-8 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-6">
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          {listing.photos.length > 0 ? (
            <div className="grid gap-2 sm:grid-cols-2">
              {listing.photos.map((photo) => (
                <div key={photo} className="relative aspect-[4/3]">
                  <Image src={photo} alt="" fill className="object-cover" sizes="(min-width: 1024px) 50vw, 100vw" />
                </div>
              ))}
            </div>
          ) : (
            <ListingArt category={listing.category} ticketType={listing.ticketType} title={listing.title} />
          )}
        </div>
        <div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{categoryLabel(listing.category, listing.ticketType)}</Badge>
            <Badge variant="outline">{CONDITION_LABELS[listing.condition]}</Badge>
            {listing.listingType === "auction" ? <Badge variant="outline">Auction</Badge> : null}
            {listing.seniorMoveOut ? <Badge className="bg-brass text-white">Senior move-out</Badge> : null}
            {listing.status === "sold" ? <Badge variant="destructive">Sold</Badge> : null}
          </div>
          <h1 className="mt-3 font-serif text-4xl leading-tight text-yale">{listing.title}</h1>
          <p className="mt-3 text-sm text-muted-foreground">Listed {formatDate(listing.createdAt)}</p>
          <p className="mt-5 max-w-2xl text-base leading-7 whitespace-pre-wrap">{listing.description}</p>
        </div>
        <BidList detail={detail} />
        <ThreadPreview detail={detail} />
      </div>
      <aside className="h-fit space-y-4 lg:sticky lg:top-28">
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-xs tracking-wide text-muted-foreground uppercase">
            {listing.listingType === "auction" ? (detail.highBidCents ? "High bid" : "Starting bid") : "Asking"}
          </p>
          <p className="mt-1 font-serif text-4xl text-yale">{price}</p>
          {listing.listingType === "auction" ? (
            <p className="mt-1 text-sm text-muted-foreground">{formatAuctionEnd(listing.auctionEndsAt)}</p>
          ) : null}
          {listing.status === "sold" ? (
            <p className="mt-4 text-sm">This one already sold. The seller’s other listings are on their profile.</p>
          ) : viewer?.id === listing.sellerId ? (
            <p className="mt-4 text-sm">This is your listing. Buyers can find it from Browse.</p>
          ) : viewer ? (
            <p className="mt-4 text-sm">
              You’re signed in as {viewer.name}. The messages below are how buyers and sellers agree on a handoff.
            </p>
          ) : (
            <Button className="mt-4 h-10 w-full" render={<Link href={`/login?next=/listings/${listing.id}`} />}>
              Sign in to arrange pickup
            </Button>
          )}
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="mb-3 text-xs tracking-wide text-muted-foreground uppercase">Seller</p>
          <Person
            user={detail.seller}
            rating={detail.sellerRating}
            reviewCount={detail.sellerReviewCount}
            sales={detail.sellerSales}
            href={`/profile/${detail.seller.id}`}
          />
        </div>
      </aside>
    </article>
  );
}
