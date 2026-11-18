import Link from "next/link";

import { Button } from "@/components/ui/button";
import { DeliveryForm } from "@/features/delivery/components/delivery-form";
import { getDeliveryOffer } from "@/features/delivery/queries";
import { Stars } from "@/features/profiles/components/stars";
import { formatMoney } from "@/lib/format";

export async function DeliveryOffer({
  listingId,
  requested,
}: {
  listingId: string;
  requested?: boolean;
}) {
  const offer = await getDeliveryOffer(listingId);
  if (!offer) return null;
  if (offer.mode === "winner-only") {
    return offer.winnerName ? (
      <p className="text-sm text-muted-foreground">Won by {offer.winnerName}.</p>
    ) : null;
  }

  return (
    <section className="rounded-xl border border-border bg-card p-5">
      {offer.mode === "status" && offer.delivery ? (
        <div className="space-y-2">
          <p className="font-serif text-2xl text-yale">Resco delivery</p>
          {requested ? <p className="text-sm">You’re set. A courier has the handoff.</p> : null}
          <p className="text-sm">
            {offer.delivery.fromCollege} → {offer.delivery.toCollege}
          </p>
          <p className="text-sm">
            {formatMoney(offer.delivery.feeCents)} · about {offer.delivery.etaMinutes} min · {labelStatus(offer.delivery.status)}
          </p>
          {offer.delivery.courier ? (
            <div>
              <p className="text-xs tracking-wide text-muted-foreground uppercase">Courier</p>
              <p className="font-medium">{offer.delivery.courier.name}</p>
              <p className="text-sm text-muted-foreground">{offer.delivery.courier.college}</p>
              {offer.delivery.courier.rating == null ? (
                <p className="text-sm text-muted-foreground">New courier</p>
              ) : (
                <Stars rating={offer.delivery.courier.rating} />
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Waiting for a student courier to accept.</p>
          )}
        </div>
      ) : null}
      {offer.mode === "signin" ? (
        <div className="space-y-3">
          <p className="font-serif text-2xl text-yale">Deliver to my college</p>
          <p className="text-sm text-muted-foreground">
            Sign in with @yale.edu and a student courier will walk it from {offer.sellerCollege}.
          </p>
          <Button className="h-10 w-full" render={<Link href={`/login?next=/listings/${listingId}`} />}>
            Sign in to request delivery
          </Button>
        </div>
      ) : null}
      {offer.mode === "form" && offer.viewerId && offer.viewerCollege ? (
        <DeliveryForm
          listingId={offer.listingId}
          sellerCollege={offer.sellerCollege}
          sellerId={offer.sellerId}
          viewerId={offer.viewerId}
          defaultCollege={offer.viewerCollege}
          couriers={offer.couriers}
        />
      ) : null}
    </section>
  );
}

function labelStatus(status: string) {
  if (status === "accepted") return "courier assigned";
  if (status === "completed") return "delivered";
  if (status === "open") return "looking for a courier";
  return status;
}
