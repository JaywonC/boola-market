import { AuctionPanel } from "@/features/auctions/components/auction-panel";
import { getAuctionSnapshot } from "@/features/auctions/snapshot";

export async function AuctionSection({
  listingId,
  bidError,
}: {
  listingId: string;
  bidError?: string;
}) {
  const snapshot = await getAuctionSnapshot(listingId);
  if (!snapshot) return null;
  return <AuctionPanel initial={snapshot} bidError={bidError} />;
}
