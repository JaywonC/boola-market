import Link from "next/link";
import { Suspense } from "react";

import { CardGridSkeleton } from "@/components/layout/skeletons";
import { ListingGrid } from "@/features/listings/components/listing-card";
import { queryListings } from "@/lib/db/queries";

export const metadata = { title: "Senior move-out" };

export default function MoveOutPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-6xl px-4 py-8"><CardGridSkeleton /></div>}>
      <MoveOutBody />
    </Suspense>
  );
}

async function MoveOutBody() {
  const cards = await queryListings({ moveout: "1", sort: "newest", status: "all" });
  const active = cards.filter((card) => card.listing.status === "active");
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <p className="text-xs font-medium tracking-[0.16em] text-brass uppercase">Class of ’27 and anyone leaving a room behind</p>
      <h1 className="mt-2 font-serif text-4xl text-yale">Senior move-out</h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Lofts, rugs, and the rest of a suite that will not fit in the car. Listings here are flagged move-out, on top of their normal category. A richer handoff schedule can grow in the move-out feature folder.
      </p>
      <p className="mt-3 text-sm">
        <Link href="/browse?moveout=1" className="font-medium text-yale hover:underline">
          Open the same filter in Browse
        </Link>
      </p>
      <div className="mt-6">
        <ListingGrid cards={active} />
      </div>
    </div>
  );
}
