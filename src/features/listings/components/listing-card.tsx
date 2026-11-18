import Image from "next/image";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ListingArt } from "@/features/listings/components/listing-art";
import { TrustBadge } from "@/features/reviews/components/trust-badge";
import { categoryLabel, CONDITION_LABELS } from "@/lib/categories";
import type { ListingCard as ListingCardModel } from "@/lib/db/queries";
import { classYear, formatAuctionEnd, formatMoney } from "@/lib/format";

export function ListingCard({ card }: { card: ListingCardModel }) {
  const { listing, seller } = card;
  const priceLabel =
    listing.listingType === "auction"
      ? card.highBidCents
        ? `High bid ${formatMoney(card.highBidCents)}`
        : `Starting ${formatMoney(listing.priceCents)}`
      : formatMoney(listing.priceCents);

  return (
    <Link href={`/listings/${listing.id}`} className="group block h-full rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
      <Card className="h-full gap-0 py-0 transition duration-200 group-hover:-translate-y-0.5 group-hover:shadow-md">
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          {listing.photos[0] ? (
            <Image
              src={listing.photos[0]}
              alt={listing.title}
              fill
              sizes="(min-width: 1024px) 320px, (min-width: 640px) 50vw, 100vw"
              className="object-cover"
            />
          ) : (
            <ListingArt
              category={listing.category}
              ticketType={listing.ticketType}
              title={listing.title}
              className="h-full w-full"
            />
          )}
          <div className="absolute top-3 left-3 flex max-w-[85%] flex-wrap gap-1.5">
            <Badge variant="secondary" className="bg-card/95 text-foreground">
              {categoryLabel(listing.category, listing.ticketType)}
            </Badge>
            {listing.seniorMoveOut ? (
              <Badge className="bg-brass text-white">Senior move-out</Badge>
            ) : null}
          </div>
        </div>
        <div className="flex flex-1 flex-col gap-2 p-4">
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-serif text-lg leading-snug text-yale">{listing.title}</h3>
          </div>
          <p className="text-base font-semibold">{priceLabel}</p>
          <p className="text-sm text-muted-foreground">
            {CONDITION_LABELS[listing.condition]}
            {listing.listingType === "auction" ? ` · ${formatAuctionEnd(listing.auctionEndsAt)}` : ""}
            {listing.status === "sold" ? " · Sold" : ""}
          </p>
          <div className="mt-auto space-y-2 pt-2">
            <p className="truncate text-sm text-muted-foreground">
              {seller.college} {classYear(seller.graduationYear)}
            </p>
            <TrustBadge rating={card.sellerRating} sales={card.sellerSales} />
          </div>
        </div>
      </Card>
    </Link>
  );
}

export function ListingGrid({ cards }: { cards: ListingCardModel[] }) {
  if (cards.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card px-6 py-16 text-center">
        <h2 className="font-serif text-2xl text-yale">Nothing matches</h2>
        <p className="mx-auto mt-2 max-w-md text-muted-foreground">
          Try another category, or clear the search. Tickets and senior move-out are the busy shelves this week.
        </p>
      </div>
    );
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((card) => (
        <ListingCard key={card.listing.id} card={card} />
      ))}
    </div>
  );
}
