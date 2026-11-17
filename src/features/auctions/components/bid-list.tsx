import type { ListingDetail } from "@/lib/db/queries";
import { formatDateTime, formatMoney } from "@/lib/format";

export function BidList({ detail }: { detail: ListingDetail }) {
  if (detail.listing.listingType !== "auction") return null;
  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-serif text-2xl text-yale">Bids</h2>
        <p className="text-sm text-muted-foreground">
          {detail.highBidCents ? `High bid ${formatMoney(detail.highBidCents)}` : `Starts at ${formatMoney(detail.listing.priceCents)}`}
        </p>
      </div>
      {detail.bids.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">No bids yet.</p>
      ) : (
        <ol className="mt-4 space-y-3">
          {detail.bids.map((bid) => (
            <li key={bid.id} className="flex items-baseline justify-between gap-3 text-sm">
              <span>
                <span className="font-medium">{bid.bidder.name}</span>
                <span className="text-muted-foreground"> · {bid.bidder.college}</span>
              </span>
              <span className="text-right">
                <span className="font-medium">{formatMoney(bid.amountCents)}</span>
                <span className="block text-xs text-muted-foreground">{formatDateTime(bid.createdAt)}</span>
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
