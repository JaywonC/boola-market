import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { getCurrentUser } from "@/features/auth/session";
import { ConversationLive } from "@/features/messages/components/conversation-live";
import { buildThreadView } from "@/features/messages/view";
import { readStoreForRender } from "@/lib/db/store";
import { formatMoney } from "@/lib/format";

export async function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/messages/${id}`);
  const thread = buildThreadView(await readStoreForRender(), id, user.id);
  if (!thread) notFound();

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-8">
      <div>
        <Link href="/messages" className="text-sm font-medium text-yale">
          Inbox
        </Link>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {thread.seniorMoveOut ? <Badge className="bg-brass text-white">Senior move-out</Badge> : null}
          <Badge variant="outline">{thread.role === "buyer" ? "You’re buying" : "You’re selling"}</Badge>
        </div>
        <h1 className="mt-3 font-serif text-4xl leading-tight text-yale">{thread.listingTitle}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          With{" "}
          <Link href={`/profile/${thread.otherId}`} className="font-medium text-foreground">
            {thread.otherName}
          </Link>{" "}
          · {thread.otherDetail} · Asking {formatMoney(thread.askingCents)}
        </p>
        <Link href={`/listings/${thread.listingId}`} className="mt-2 inline-block text-sm font-medium text-yale">
          View listing
        </Link>
      </div>
      <ConversationLive key={thread.id} initial={thread} />
    </div>
  );
}
