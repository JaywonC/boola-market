/**
 * Live auctions.
 * The listing page mounts AuctionSection, which polls /api/auctions/[listingId].
 * placeBid enforces a $5 minimum raise. settleExpiredAuctions records the winner.
 */
export const AUCTIONS_PLUGIN = {
  id: "auctions",
  entry: "src/features/auctions/components/auction-section.tsx",
  write: "src/features/auctions/actions.ts",
  rules: "src/features/auctions/rules.ts",
} as const;

export { evaluateBid } from "@/features/auctions/rules";
