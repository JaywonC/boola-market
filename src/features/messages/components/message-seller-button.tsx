"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { openListingThread } from "@/features/messages/actions";

const initial = { error: "" };

export function MessageSellerButton({ listingId }: { listingId: string }) {
  const [state, action, pending] = useActionState(openListingThread, initial);
  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="listingId" value={listingId} />
      {state.error ? (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending} className="h-10 w-full">
        {pending ? "Opening…" : "Message seller"}
      </Button>
    </form>
  );
}
