import Link from "next/link";

import { getCurrentUser } from "@/features/auth/session";
import { countUnread } from "@/features/messages/view";
import { readStoreForRender } from "@/lib/db/store";

export async function MessagesNavLink() {
  const user = await getCurrentUser();
  if (!user) return null;
  const unread = countUnread(await readStoreForRender(), user.id);
  return (
    <Link href="/messages" className="relative hidden h-9 items-center gap-1.5 text-sm hover:text-yale md:inline-flex">
      Messages
      {unread > 0 ? (
        <span className="grid min-w-5 place-items-center rounded-full bg-brass px-1.5 text-[11px] font-semibold text-white">
          {unread}
        </span>
      ) : null}
      {unread > 0 ? <span className="sr-only">{unread} unread</span> : null}
    </Link>
  );
}
