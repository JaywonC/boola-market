/**
 * Haggling chat.
 * Threads are stored and shown on the listing page. Next: a composer that calls sendMessage.
 */
export const MESSAGES_PLUGIN = {
  id: "messages",
  entry: "src/features/messages/components/thread-preview.tsx",
  write: "src/features/messages/actions.ts",
  rules: "src/features/messages/rules.ts",
} as const;

export { evaluateMessage } from "@/features/messages/rules";
