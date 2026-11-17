/**
 * Resco-to-resco delivery.
 * Sellers already have a residential college. Add a handoff on the order,
 * then surface it on the listing page and the order record.
 */
export const DELIVERY_PLUGIN = {
  id: "delivery",
  status: "stub",
  suggestedEntry: "src/app/listings/[id]/page.tsx",
  dependsOn: "src/features/orders",
} as const;

export type HandoffRequest = {
  orderId: string;
  fromCollege: string;
  toCollege: string;
  note: string;
};
