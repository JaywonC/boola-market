"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/features/auth/session";
import { encodeStructuredMessage, parseDollarsToCents } from "@/features/messages/rules";
import { buildThreadView, type ThreadView } from "@/features/messages/view";
import { recordOrder } from "@/features/orders/actions";
import { insertConversationMessage, insertMessage, markConversationRead, openConversation, readStore } from "@/lib/db/store";

export type ThreadActionResult = { ok: true; thread: ThreadView } | { ok: false; error: string };

async function finish(
  conversationId: string,
  userId: string,
  result: { ok: true } | { ok: false; error: string },
): Promise<ThreadActionResult> {
  if (!result.ok) return result;
  revalidatePath(`/messages/${conversationId}`);
  revalidatePath("/messages");
  const thread = buildThreadView(await readStore(), conversationId, userId);
  if (!thread) return { ok: false, error: "That conversation is gone." };
  return { ok: true, thread };
}

export async function loadThread(conversationId: string): Promise<ThreadActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Sign in with your Yale email first." };
  const marked = await markConversationRead(conversationId, user.id);
  if (!marked.ok) return marked;
  if (marked.changed) revalidatePath("/messages");
  const thread = buildThreadView(await readStore(), conversationId, user.id);
  if (!thread) return { ok: false, error: "That conversation is gone." };
  return { ok: true, thread };
}

export async function postText(conversationId: string, body: string): Promise<ThreadActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Sign in with your Yale email first." };
  const result = await insertConversationMessage({ conversationId, senderId: user.id, body });
  return finish(conversationId, user.id, result);
}

export async function postOffer(conversationId: string, rawDollars: string): Promise<ThreadActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Sign in with your Yale email first." };
  const cents = parseDollarsToCents(rawDollars);
  if (cents == null) return { ok: false, error: "Enter a price like 45." };
  const result = await insertConversationMessage({
    conversationId,
    senderId: user.id,
    body: encodeStructuredMessage("offer", cents),
  });
  return finish(conversationId, user.id, result);
}

export async function postCounter(conversationId: string, rawDollars: string): Promise<ThreadActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Sign in with your Yale email first." };
  const cents = parseDollarsToCents(rawDollars);
  if (cents == null) return { ok: false, error: "Enter a price like 60." };
  const result = await insertConversationMessage({
    conversationId,
    senderId: user.id,
    body: encodeStructuredMessage("counter", cents),
  });
  return finish(conversationId, user.id, result);
}

export async function respondToOffer(
  conversationId: string,
  kind: "accept" | "decline",
): Promise<ThreadActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Sign in with your Yale email first." };
  const current = buildThreadView(await readStore(), conversationId, user.id);
  if (!current) return { ok: false, error: "That conversation is gone." };
  if (!current.pending || current.pending.mine) {
    return { ok: false, error: "There isn’t an offer to respond to." };
  }
  const result = await insertConversationMessage({
    conversationId,
    senderId: user.id,
    body: encodeStructuredMessage(kind, current.pending.cents),
  });
  return finish(conversationId, user.id, result);
}

export async function purchaseAgreed(conversationId: string): Promise<ThreadActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Sign in with your Yale email first." };
  const current = buildThreadView(await readStore(), conversationId, user.id);
  if (!current) return { ok: false, error: "That conversation is gone." };
  if (!current.canBuy || current.agreedCents == null) {
    return { ok: false, error: "Accept an offer before buying." };
  }
  const result = await recordOrder(current.listingId, current.agreedCents, "pending");
  if (!result.ok) return result;
  revalidatePath(`/messages/${conversationId}`);
  revalidatePath("/messages");
  const thread = buildThreadView(await readStore(), conversationId, user.id);
  if (!thread) return { ok: false, error: "That conversation is gone." };
  return { ok: true, thread };
}

/** Kept for the original plug-in. The live thread posts by conversation id. */
export async function sendMessage(listingId: string, body: string) {
  const user = await getCurrentUser();
  if (!user) return { ok: false as const, error: "Sign in with your Yale email first." };
  const result = await insertMessage({ listingId, senderId: user.id, body });
  if (result.ok) {
    revalidatePath(`/listings/${listingId}`);
    revalidatePath("/messages");
    revalidatePath(`/messages/${result.conversation.id}`);
  }
  return result;
}

export async function openListingThread(
  _prev: { error: string },
  formData: FormData,
): Promise<{ error: string }> {
  const listingId = String(formData.get("listingId") ?? "");
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/listings/${encodeURIComponent(listingId)}`);
  const opened = await openConversation(listingId, user.id);
  if (!opened.ok) return { error: opened.error };
  revalidatePath("/messages");
  revalidatePath(`/listings/${listingId}`);
  redirect(`/messages/${opened.conversation.id}`);
}
