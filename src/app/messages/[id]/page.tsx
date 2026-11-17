import { Suspense } from "react";

import { ConversationPage } from "@/features/messages/components/conversation-page";

export const metadata = { title: "Conversation" };

export default function MessageThreadPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<p className="mx-auto max-w-3xl px-4 py-10 text-sm text-muted-foreground">Loading conversation…</p>}>
      <ConversationPage params={params} />
    </Suspense>
  );
}
