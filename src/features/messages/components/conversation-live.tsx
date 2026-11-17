"use client";

import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { loadThread, postCounter, postOffer, postText, purchaseAgreed, respondToOffer } from "@/features/messages/actions";
import { formatOfferAmount, parseDollarsToCents, structuredLabel } from "@/features/messages/rules";
import type { ThreadMessageView, ThreadView } from "@/features/messages/view";
import { formatDateTime, formatMoney } from "@/lib/format";

function sameThread(current: ThreadView, next: ThreadView) {
  const lastCurrent = current.messages.at(-1)?.id;
  const lastNext = next.messages.at(-1)?.id;
  return (
    lastCurrent === lastNext &&
    current.messages.length === next.messages.length &&
    current.agreedCents === next.agreedCents &&
    current.pending?.id === next.pending?.id &&
    current.orderStatus === next.orderStatus &&
    current.canBuy === next.canBuy
  );
}

function statusLabel(state: NonNullable<ThreadMessageView["structured"]>["state"]) {
  if (state === "pending") return "Waiting";
  if (state === "accepted") return "Accepted";
  if (state === "declined") return "Declined";
  return "Replaced";
}

export function ConversationLive({ initial }: { initial: ThreadView }) {
  const [thread, setThread] = useState(initial);
  const [draft, setDraft] = useState("");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const count = useRef(initial.messages.length);

  useEffect(() => {
    const node = scroller.current;
    if (!node) return;
    node.scrollTo({ top: node.scrollHeight });
  }, []);

  useEffect(() => {
    if (thread.messages.length === count.current) return;
    count.current = thread.messages.length;
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [thread.messages.length]);

  useEffect(() => {
    let cancelled = false;
    const pull = () => {
      void loadThread(thread.id).then((result) => {
        if (cancelled || !result.ok) return;
        setThread((current) => {
          const currentLast = current.messages.at(-1)?.createdAt ?? "";
          const nextLast = result.thread.messages.at(-1)?.createdAt ?? "";
          if (nextLast < currentLast || result.thread.messages.length < current.messages.length) return current;
          if (current.orderStatus && !result.thread.orderStatus && nextLast === currentLast) return current;
          return sameThread(current, result.thread) ? current : result.thread;
        });
      });
    };
    pull();
    const timer = setInterval(pull, 4000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [thread.id]);

  async function run(task: () => Promise<Awaited<ReturnType<typeof postText>>>, clear?: () => void) {
    setBusy(true);
    setError("");
    try {
      const result = await task();
      if (!result.ok) {
        setError(result.error);
        return;
      }
      clear?.();
      setThread(result.thread);
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  }

  function sendText() {
    const body = draft.trim();
    if (!body || busy) return;
    void run(() => postText(thread.id, body), () => setDraft(""));
  }

  function sendPrice() {
    if (busy) return;
    if (parseDollarsToCents(amount) == null) {
      setError("Enter a price like 45.");
      return;
    }
    void run(
      () => (thread.canCounter ? postCounter(thread.id, amount) : postOffer(thread.id, amount)),
      () => setAmount(""),
    );
  }

  function respond(kind: "accept" | "decline") {
    if (busy) return;
    void run(() => respondToOffer(thread.id, kind));
  }

  function buy() {
    if (busy || thread.agreedCents == null) return;
    void run(() => purchaseAgreed(thread.id));
  }

  const cents = parseDollarsToCents(amount);
  const priceVerb = thread.canCounter ? "Counter" : "Offer";
  const priceLabel = cents ? `${priceVerb} ${formatOfferAmount(cents)}` : priceVerb;

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-2 text-xs text-muted-foreground">
        <p className="flex items-center gap-2">
          <span className="size-1.5 rounded-full bg-brass" aria-hidden />
          Updates every few seconds
        </p>
        <p>Asking {formatMoney(thread.askingCents)}</p>
      </div>
      {thread.agreedCents != null && !thread.pending ? (
        <div className="border-b border-brass/30 bg-brass/10 px-4 py-3">
          <p className="font-medium text-yale">Agreed at {formatMoney(thread.agreedCents)}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            This price is locked for {thread.role === "buyer" ? "you" : thread.otherName}. The public asking price stays{" "}
            {formatMoney(thread.askingCents)}.
          </p>
          {thread.canBuy ? (
            <Button type="button" onClick={() => void buy()} disabled={busy} className="mt-3 h-10">
              {busy ? "Recording…" : `Buy at ${formatMoney(thread.agreedCents)}`}
            </Button>
          ) : null}
          {thread.orderStatus === "pending" && thread.orderCents ? (
            <p className="mt-2 text-sm">
              Purchase recorded at {formatMoney(thread.orderCents)}. Pay when you meet — nothing is charged here.
            </p>
          ) : null}
          {thread.orderStatus === "completed" ? <p className="mt-2 text-sm">This sale is already complete.</p> : null}
          {thread.role === "seller" && !thread.orderStatus ? (
            <p className="mt-2 text-sm">{thread.otherName} can buy at this price from this thread.</p>
          ) : null}
        </div>
      ) : null}
      <div ref={scroller} className="flex max-h-[32rem] min-h-72 flex-col gap-3 overflow-y-auto p-4" aria-live="polite">
        {thread.messages.length === 0 ? (
          <p className="text-sm text-muted-foreground">No messages yet. Say hello, or send an offer under the asking price.</p>
        ) : (
          thread.messages.map((message) => <MessageRow key={message.id} message={message} />)
        )}
      </div>
      <div className="space-y-3 border-t border-border p-4">
        {error ? (
          <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        ) : null}
        {thread.canRespond && thread.pending ? (
          <div className="flex flex-wrap gap-2">
            <Button type="button" className="h-10" disabled={busy} onClick={() => void respond("accept")}>
              Accept {formatMoney(thread.pending.cents)}
            </Button>
            <Button type="button" variant="outline" className="h-10" disabled={busy} onClick={() => void respond("decline")}>
              Decline
            </Button>
          </div>
        ) : null}
        {thread.pending?.mine ? (
          <p className="text-sm text-muted-foreground">
            Waiting on {thread.otherName} to accept, decline, or counter {formatMoney(thread.pending.cents)}.
          </p>
        ) : null}
        {thread.canOffer || thread.canCounter ? (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="offer-amount">{thread.canCounter ? "Counter" : "Your offer"}</Label>
              <Input
                id="offer-amount"
                inputMode="decimal"
                placeholder="Amount"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                className="h-10 bg-background"
              />
            </div>
            <Button type="button" className="h-10" disabled={busy} onClick={() => void sendPrice()}>
              {priceLabel}
            </Button>
          </div>
        ) : null}
        {thread.canOffer && thread.agreedCents != null ? (
          <p className="text-xs text-muted-foreground">A new offer replaces the agreed price.</p>
        ) : null}
        <div className="space-y-2">
          <Label htmlFor="message-body" className="sr-only">
            Message
          </Label>
          <Textarea
            id="message-body"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void sendText();
              }
            }}
            placeholder="Write a message"
            className="min-h-16 bg-background"
          />
          <div className="flex justify-end">
            <Button type="button" variant="secondary" className="h-10" disabled={busy || draft.trim().length === 0} onClick={() => void sendText()}>
              Send
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MessageRow({ message }: { message: ThreadMessageView }) {
  const structured = message.structured;
  if (structured && (structured.kind === "offer" || structured.kind === "counter")) {
    return (
      <article className="rounded-2xl border border-brass/40 bg-brass/10 px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium tracking-wide text-brass uppercase">
              {structured.kind === "counter" ? "Counter" : "Offer"} · {message.mine ? "You" : message.senderName}
            </p>
            <p className="font-serif text-3xl text-yale">{formatMoney(structured.cents)}</p>
          </div>
          <p className="rounded-full bg-card px-2 py-1 text-xs text-muted-foreground">{statusLabel(structured.state)}</p>
        </div>
        {message.note ? <p className="mt-2 text-sm leading-6">{message.note}</p> : null}
        <p className="mt-2 text-xs text-muted-foreground">{formatDateTime(message.createdAt)}</p>
      </article>
    );
  }
  if (structured && (structured.kind === "accept" || structured.kind === "decline")) {
    return (
      <p className="text-center text-sm text-muted-foreground">
        {structuredLabel(structured.kind, structured.cents)}
        {message.note ? ` — ${message.note}` : ""} · {formatDateTime(message.createdAt)}
      </p>
    );
  }
  return (
    <div className={message.mine ? "ml-auto max-w-[85%]" : "mr-auto max-w-[85%]"}>
      <p className="mb-1 text-xs text-muted-foreground">
        {message.mine ? "You" : message.senderName} · {formatDateTime(message.createdAt)}
      </p>
      <div
        className={
          message.mine
            ? "rounded-2xl rounded-br-md bg-yale px-3 py-2 text-sm leading-6 text-primary-foreground"
            : "rounded-2xl rounded-bl-md bg-muted px-3 py-2 text-sm leading-6"
        }
      >
        <p className="whitespace-pre-wrap">{message.note}</p>
      </div>
    </div>
  );
}
