import Link from "next/link";

import { getCurrentUser } from "@/features/auth/session";
import { previewText } from "@/features/messages/rules";
import type { ListingDetail } from "@/lib/db/queries";
import { formatDateTime } from "@/lib/format";

export async function ThreadPreview({ detail }: { detail: ListingDetail }) {
  const viewer = await getCurrentUser();
  const mine =
    viewer && viewer.id !== detail.listing.sellerId
      ? detail.threads.find((thread) => thread.buyer.id === viewer.id)
      : undefined;

  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <h2 className="font-serif text-2xl text-yale">Messages</h2>
      {!viewer ? (
        <p className="mt-3 text-sm text-muted-foreground">
          Sign in to message the seller. Offers stay between the two of you.
        </p>
      ) : viewer.id === detail.listing.sellerId ? (
        detail.threads.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No buyers have written yet.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {detail.threads.map((thread) => {
              const last = thread.messages.at(-1);
              return (
                <li key={thread.id}>
                  <Link href={`/messages/${thread.id}`} className="block rounded-lg bg-muted px-3 py-2 hover:bg-accent">
                    <p className="text-sm font-medium">{thread.buyer.name}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {last ? previewText(last.body) : "No messages yet"}
                    </p>
                  </Link>
                </li>
              );
            })}
          </ul>
        )
      ) : detail.listing.listingType !== "fixed" ? (
        <p className="mt-3 text-sm text-muted-foreground">Haggling is for fixed-price listings.</p>
      ) : !mine ? (
        <p className="mt-3 text-sm text-muted-foreground">
          Use Message seller to open a thread and send an offer.
        </p>
      ) : (
        <div className="mt-4">
          <ul className="space-y-3">
            {mine.messages.slice(-3).map((message) => (
              <li key={message.id} className="rounded-lg bg-muted px-3 py-2">
                <p className="text-sm">
                  <span className="font-medium">{message.sender.name}</span>
                  <span className="text-muted-foreground"> · {formatDateTime(message.createdAt)}</span>
                </p>
                <p className="mt-1 text-sm leading-6">{previewText(message.body)}</p>
              </li>
            ))}
          </ul>
          <Link href={`/messages/${mine.id}`} className="mt-3 inline-block text-sm font-medium text-yale">
            Open conversation
          </Link>
        </div>
      )}
    </section>
  );
}
