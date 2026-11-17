"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { purchaseAgreed } from "@/features/messages/actions";
import { formatMoney } from "@/lib/format";

export function PurchaseButton({ conversationId, cents }: { conversationId: string; cents: number }) {
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [pending, setPending] = useState(false);

  async function buy() {
    setPending(true);
    setError("");
    const result = await purchaseAgreed(conversationId);
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setDone(true);
  }

  if (done) {
    return <p className="text-sm">Purchase recorded at {formatMoney(cents)}. Pay when you pick it up.</p>;
  }

  return (
    <div className="space-y-2">
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <Button type="button" onClick={() => void buy()} disabled={pending} className="h-10 w-full">
        {pending ? "Recording…" : `Buy at ${formatMoney(cents)}`}
      </Button>
    </div>
  );
}
