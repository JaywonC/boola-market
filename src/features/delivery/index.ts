/**
 * Resco-to-resco delivery.
 * Buyers request a walk on a fixed-price listing or after they win an auction.
 * Couriers opt in at /couriers and accept open handoffs.
 */
export const DELIVERY_PLUGIN = {
  id: "delivery",
  entry: "src/features/delivery/components/delivery-offer.tsx",
  board: "src/app/couriers/page.tsx",
  pricing: "src/features/delivery/pricing.ts",
} as const;

export type HandoffRequest = {
  orderId: string;
  fromCollege: string;
  toCollege: string;
  note: string;
};
