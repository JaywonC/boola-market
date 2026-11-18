import Link from "next/link";

import { Button } from "@/components/ui/button";
import { MessageSellerButton } from "@/features/messages/components/message-seller-button";
import { PurchaseButton } from "@/features/messages/components/purchase-button";
import { buildThreadView } from "@/features/messages/view";
import type { ListingStatus, ListingType } from "@/lib/categories";
import { readStoreForRender } from "@/lib/db/store";
import { formatMoney } from "@/lib/format";

export async function ListingThreadPanel({
  listingId,
  listingType,
  status,
  sellerId,
  sellerName,
  viewer,
}: {
  listingId: string;
  listingType: ListingType;
  status: ListingStatus;
  sellerId: string;
  sellerName: string;
  viewer: { id: string; name: string } | null;
}) {
  if (status === "sold") {
    return <p className="mt-4 text-sm">This one already sold. The seller’s other listings are on their profile.</p>;
  }
  if (!viewer) {
    return (
      <Button className="mt-4 h-10 w-full" render={<Link href={`/login?next=/listings/${listingId}`} />}>
        Sign in to message the seller
      </Button>
    );
  }
  if (viewer.id === sellerId) {
    return (
      <div className="mt-4 space-y-3">
        <p className="text-sm">This is your listing. Buyers send offers from Message seller.</p>
        {listingType === "fixed" ? (
          <Button variant="outline" className="h-10 w-full" render={<Link href="/messages" />}>
            Buyer messages
          </Button>
        ) : null}
      </div>
    );
  }
  if (listingType !== "fixed") {
    return <p className="mt-4 text-sm">This is an auction. Bids are on the listing, and haggling stays on fixed prices.</p>;
  }

  const store = await readStoreForRender();
  const conversation = store.conversations.find(
    (item) => item.listingId === listingId && item.buyerId === viewer.id,
  );
  const thread = conversation ? buildThreadView(store, conversation.id, viewer.id) : null;

  return (
    <div className="mt-4 space-y-3">
      <MessageSellerButton listingId={listingId} />
      {thread?.orderStatus === "pending" && thread.orderCents ? (
        <p className="text-sm">Purchase pending at {formatMoney(thread.orderCents)}. Pay {sellerName} when you meet.</p>
      ) : thread?.agreedCents ? (
        <div className="space-y-3">
          <p className="text-sm">
            {sellerName} locked {formatMoney(thread.agreedCents)} for you. The asking price is unchanged for everyone else.
          </p>
          {thread.canBuy ? <PurchaseButton conversationId={thread.id} cents={thread.agreedCents} /> : null}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Send an offer in the thread. If {sellerName.split(" ")[0]} accepts, that price is yours.
        </p>
      )}
    </div>
  );
}
