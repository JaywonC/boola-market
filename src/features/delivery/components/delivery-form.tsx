"use client";

import { useActionState, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { requestDelivery, type DeliveryActionState } from "@/features/delivery/actions";
import { quoteDelivery, recommendCourier } from "@/features/delivery/pricing";
import type { CourierCard } from "@/features/delivery/queries";
import { Stars } from "@/features/profiles/components/stars";
import { COLLEGES, type College } from "@/lib/colleges";
import { formatMoney } from "@/lib/format";

const initial: DeliveryActionState = { error: "" };

export function DeliveryForm({
  listingId,
  sellerCollege,
  sellerId,
  viewerId,
  defaultCollege,
  couriers,
}: {
  listingId: string;
  sellerCollege: College;
  sellerId: string;
  viewerId: string;
  defaultCollege: College;
  couriers: CourierCard[];
}) {
  const [toCollege, setToCollege] = useState<College>(defaultCollege);
  const [state, action, pending] = useActionState(requestDelivery, initial);
  const quote = quoteDelivery(sellerCollege, toCollege);
  const courier = useMemo(
    () => recommendCourier(couriers, toCollege, [viewerId, sellerId]),
    [couriers, toCollege, viewerId, sellerId],
  );

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="listingId" value={listingId} />
      <div>
        <p className="font-serif text-2xl text-yale">Deliver to my college</p>
        <p className="mt-1 text-sm text-muted-foreground">
          A student courier walks it from {sellerCollege} to the college you pick.
        </p>
      </div>
      {state.error ? (
        <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
      <label className="block text-sm">
        <span className="mb-1 block font-medium">Your college</span>
        <select
          name="toCollege"
          value={toCollege}
          onChange={(event) => setToCollege(event.target.value as College)}
          className="h-10 w-full rounded-lg border border-input bg-background px-3"
        >
          {COLLEGES.map((college) => (
            <option key={college} value={college}>
              {college}
            </option>
          ))}
        </select>
      </label>
      <dl className="grid grid-cols-2 gap-3 rounded-lg bg-muted px-3 py-3">
        <div>
          <dt className="text-xs tracking-wide text-muted-foreground uppercase">Delivery fee</dt>
          <dd className="font-serif text-2xl text-yale">{formatMoney(quote.feeCents)}</dd>
        </div>
        <div>
          <dt className="text-xs tracking-wide text-muted-foreground uppercase">ETA</dt>
          <dd className="font-serif text-2xl text-yale">{quote.etaMinutes} min</dd>
        </div>
      </dl>
      {courier ? (
        <div className="rounded-lg border border-border px-3 py-3">
          <p className="text-xs tracking-wide text-muted-foreground uppercase">Assigned courier</p>
          <p className="mt-1 font-medium">{courier.name}</p>
          <p className="text-sm text-muted-foreground">{courier.college}</p>
          <div className="mt-1">
            {courier.rating == null ? (
              <p className="text-sm text-muted-foreground">New courier</p>
            ) : (
              <Stars rating={courier.rating} />
            )}
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          No courier is on duty for this walk. The request will stay open on the courier board.
        </p>
      )}
      <Button type="submit" disabled={pending} className="h-10 w-full">
        {pending ? "Requesting…" : "Deliver to my college"}
      </Button>
    </form>
  );
}
