/**
 * Haggling chat.
 * Buyers open a thread from Message seller on a fixed-price listing.
 * The inbox is /messages, and the thread polls for new offers.
 */
export const MESSAGES_PLUGIN = {
  id: "messages",
  entry: "src/features/messages/components/thread-preview.tsx",
  write: "src/features/messages/actions.ts",
  rules: "src/features/messages/rules.ts",
} as const;

export { evaluateMessage, evaluateThreadPost } from "@/features/messages/rules";
