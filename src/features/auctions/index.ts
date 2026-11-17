/**
 * Live auctions.
 * Data and validation already exist. The listing page renders bid history.
 * Next: a bid form that calls placeBid, plus realtime updates and a shared countdown.
 */
export const AUCTIONS_PLUGIN = {
  id: "auctions",
  entry: "src/features/auctions/components/bid-list.tsx",
  write: "src/features/auctions/actions.ts",
  rules: "src/features/auctions/rules.ts",
} as const;

export { evaluateBid } from "@/features/auctions/rules";
