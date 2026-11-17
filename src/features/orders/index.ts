/** Agreed sales. Completed orders drive the sales count on a profile. */
export const ORDERS_PLUGIN = {
  id: "orders",
  write: "src/features/orders/actions.ts",
  rules: "src/features/orders/rules.ts",
} as const;

export { evaluateOrder } from "@/features/orders/rules";
