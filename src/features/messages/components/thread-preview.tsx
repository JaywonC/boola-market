import type { ListingDetail } from "@/lib/db/queries";
import { formatDateTime } from "@/lib/format";

export function ThreadPreview({ detail }: { detail: ListingDetail }) {
  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <h2 className="font-serif text-2xl text-yale">Messages</h2>
      {detail.threads.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">
          No messages yet. When a buyer writes, the thread stays on this listing.
        </p>
      ) : (
        <div className="mt-4 space-y-5">
          {detail.threads.map((thread) => (
            <div key={thread.id}>
              <p className="text-sm text-muted-foreground">With {thread.buyer.name}</p>
              <ul className="mt-2 space-y-3">
                {thread.messages.map((message) => (
                  <li key={message.id} className="rounded-lg bg-muted px-3 py-2">
                    <p className="text-sm">
                      <span className="font-medium">{message.sender.name}</span>
                      <span className="text-muted-foreground"> · {formatDateTime(message.createdAt)}</span>
                    </p>
                    <p className="mt-1 text-sm leading-6">{message.body}</p>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
