/**
 * Data access for Yale Marketplace.
 *
 * DATA_PROVIDER=local (default) uses data/store.json, created from src/lib/db/seed.ts
 * on first read. DATA_PROVIDER=supabase is reserved for src/lib/db/supabase.ts.
 */
import { supabaseNotReady } from "@/lib/db/supabase";

export function assertDataProvider() {
  if (process.env.DATA_PROVIDER === "supabase") {
    supabaseNotReady();
  }
}

export {
  getHomeFeed,
  getListingDetail,
  getMarketplaceStats,
  getProfile,
  getUserByEmail,
  getUserById,
  queryListings,
} from "@/lib/db/queries";

export {
  insertBid,
  insertListing,
  insertMessage,
  insertOrder,
  insertReview,
  insertUser,
  readStore,
} from "@/lib/db/store";
