import Link from "next/link";
import { redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { getCurrentUser } from "@/features/auth/session";
import { buildInbox } from "@/features/messages/view";
import { readStoreForRender } from "@/lib/db/store";
import { formatDateTime, formatMoney } from "@/lib/format";

export async function InboxPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/messages");
  const rows = buildInbox(await readStoreForRender(), user.id);
  const unread = rows.filter((row) => row.unread).length;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <p className="text-xs font-medium tracking-[0.18em] text-brass uppercase">Inbox</p>
      <h1 className="mt-2 font-serif text-4xl text-yale">Messages</h1>
      <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
        Offers and pickup plans with other Yale students.
        {unread > 0
          ? ` ${unread} conversation${unread === 1 ? "" : "s"} with a new reply.`
          : " A brass dot means a new reply."}
      </p>
      {rows.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-border bg-card p-6">
          <p className="text-sm text-muted-foreground">
            No conversations yet. Open a fixed-price listing and choose Message seller.
          </p>
          <Link href="/browse" className="mt-3 inline-block text-sm font-medium text-yale">
            Browse listings
          </Link>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {rows.map((row) => (
            <li key={row.id}>
              <Link
                href={`/messages/${row.id}`}
                className="block rounded-2xl border border-border bg-card px-4 py-3 hover:border-yale/30"
              >
                <div className="flex items-start gap-3">
                  <span
                    className={
                      row.unread
                        ? "mt-2 size-2 shrink-0 rounded-full bg-brass"
                        : "mt-2 size-2 shrink-0 rounded-full bg-transparent"
                    }
                    aria-hidden
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className={row.unread ? "truncate font-semibold" : "truncate font-medium"}>{row.listingTitle}</p>
                      <time className="shrink-0 text-xs text-muted-foreground" dateTime={row.updatedAt}>
                        {formatDateTime(row.updatedAt)}
                      </time>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {row.otherName} · {row.otherDetail}
                    </p>
                    <p className="mt-1 truncate text-sm">{row.preview}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {row.seniorMoveOut ? <Badge className="bg-brass text-white">Senior move-out</Badge> : null}
                      {row.agreedCents ? (
                        <Badge variant="secondary">Agreed {formatMoney(row.agreedCents)}</Badge>
                      ) : (
                        <Badge variant="outline">Asking {formatMoney(row.askingCents)}</Badge>
                      )}
                      {row.unread ? <span className="sr-only">Unread</span> : null}
                    </div>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
