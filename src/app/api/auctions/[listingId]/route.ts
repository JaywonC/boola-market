import { NextResponse } from "next/server";

import { getAuctionSnapshot } from "@/features/auctions/snapshot";

export async function GET(
  _request: Request,
  context: { params: Promise<{ listingId: string }> },
) {
  const { listingId } = await context.params;
  const snapshot = await getAuctionSnapshot(listingId);
  if (!snapshot) {
    return NextResponse.json({ error: "Auction not found." }, { status: 404 });
  }
  return NextResponse.json(snapshot);
}
