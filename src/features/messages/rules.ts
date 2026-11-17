export type MessageDecision = { ok: true; body: string } | { ok: false; error: string };

export function evaluateMessage(input: {
  senderId: string;
  buyerId: string;
  sellerId: string;
  body: string;
}): MessageDecision {
  const body = input.body.trim();
  if (input.senderId !== input.buyerId && input.senderId !== input.sellerId) {
    return { ok: false, error: "Only the buyer and seller can use this thread." };
  }
  if (body.length < 1) return { ok: false, error: "Write a message first." };
  if (body.length > 2000) return { ok: false, error: "Keep the message under 2,000 characters." };
  return { ok: true, body };
}
