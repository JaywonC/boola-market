import { Suspense } from "react";

import { InboxPage } from "@/features/messages/components/inbox-page";

export const metadata = { title: "Messages" };

export default function MessagesPage() {
  return (
    <Suspense fallback={<p className="mx-auto max-w-3xl px-4 py-10 text-sm text-muted-foreground">Loading inbox…</p>}>
      <InboxPage />
    </Suspense>
  );
}
