import Link from "next/link";

import { Button } from "@/components/ui/button";
import { submitBid } from "@/features/auctions/actions";
import type { AuctionSnapshot } from "@/features/auctions/snapshot";
import { formatDateTime, formatMoney } from "@/lib/format";

const liveScript = `
(function () {
  if (window.__ymAuctionLive) return;
  window.__ymAuctionLive = true;
  var root = document.getElementById("auction-live");
  if (!root) return;
  var ends = Date.parse(root.getAttribute("data-ends") || "");
  var listingId = root.getAttribute("data-listing") || "";
  var clock = document.getElementById("auction-countdown");
  function pad(value) { return String(value).padStart(2, "0"); }
  function tick() {
    if (!clock) return;
    var ms = ends - Date.now();
    if (!(ms > 0)) { clock.textContent = "Ended"; return; }
    var total = Math.floor(ms / 1000);
    clock.textContent = Math.floor(total / 3600) + "h " + pad(Math.floor((total % 3600) / 60)) + "m " + pad(total % 60) + "s";
  }
  tick();
  window.setInterval(tick, 1000);
  function money(cents) {
    var dollars = cents / 100;
    return cents % 100 === 0 ? "$" + dollars.toFixed(0) : "$" + dollars.toFixed(2);
  }
  function when(iso) {
    try {
      return new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
    } catch (error) {
      return "";
    }
  }
  function poll() {
    fetch("/api/auctions/" + listingId, { cache: "no-store" }).then(function (response) {
      if (!response.ok) return null;
      return response.json();
    }).then(function (data) {
      if (!data) return;
      var top = document.getElementById("auction-top");
      var amount = data.highBidCents == null ? data.startPriceCents : data.highBidCents;
      if (top) top.textContent = money(amount);
      var list = document.getElementById("auction-history");
      if (list && Array.isArray(data.bids)) {
        list.replaceChildren();
        data.bids.forEach(function (bid, index) {
          var li = document.createElement("li");
          li.className = "flex items-baseline justify-between gap-3 text-sm";
          var left = document.createElement("span");
          var name = document.createElement("span");
          name.className = "font-medium";
          name.textContent = bid.name;
          var meta = document.createElement("span");
          meta.className = "text-muted-foreground";
          meta.textContent = " · " + bid.college;
          left.appendChild(name);
          left.appendChild(meta);
          if (index === 0) {
            var mark = document.createElement("span");
            mark.className = "text-yale";
            mark.textContent = " · top";
            left.appendChild(mark);
          }
          var right = document.createElement("span");
          right.className = "text-right";
          var price = document.createElement("span");
          price.className = "font-medium";
          price.textContent = money(bid.amountCents);
          var time = document.createElement("span");
          time.className = "block text-xs text-muted-foreground";
          time.textContent = when(bid.createdAt);
          right.appendChild(price);
          right.appendChild(time);
          li.appendChild(left);
          li.appendChild(right);
          list.appendChild(li);
        });
      }
      if (data.ended && data.winner) {
        var note = document.getElementById("auction-ended");
        if (note) note.textContent = "Winner: " + data.winner.name + ", " + data.winner.college + ".";
        var form = document.getElementById("auction-bid-form");
        if (form) form.hidden = true;
      }
    }).catch(function () {});
  }
  window.setInterval(poll, 4000);
})();
`;

export function AuctionPanel({
  initial,
  bidError,
}: {
  initial: AuctionSnapshot;
  bidError?: string;
}) {
  const ended = initial.ended || Date.parse(initial.endsAt) <= initial.serverNow;
  const top = initial.highBidCents ?? initial.startPriceCents;

  return (
    <section
      id="auction-live"
      data-listing={initial.listingId}
      data-ends={initial.endsAt}
      className="rounded-xl border border-border bg-card p-5"
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs tracking-wide text-muted-foreground uppercase">
            {ended ? "Auction ended" : "Live auction"}
          </p>
          <p id="auction-top" className="font-serif text-4xl text-yale">
            {formatMoney(top)}
          </p>
          <p className="text-sm text-muted-foreground">
            {initial.highBidCents ? "Current top bid" : "Starting bid"} · raises by {formatMoney(initial.incrementCents)}
          </p>
        </div>
        <p id="auction-countdown" className="font-mono text-lg text-yale" aria-live="polite">
          {ended ? "Ended" : formatRemaining(initial.endsAt, initial.serverNow)}
        </p>
      </div>

      {ended ? (
        <p id="auction-ended" className="mt-4 text-sm">
          {initial.winner
            ? `Winner: ${initial.winner.name}, ${initial.winner.college}.`
            : initial.bids.length > 0
              ? "The auction just closed. The winner is being recorded."
              : "The auction ended without a bid."}
          {initial.viewerIsWinner ? " You won. Request a resco delivery from the card on this page." : ""}
        </p>
      ) : initial.viewerIsSeller ? (
        <p className="mt-4 text-sm text-muted-foreground">This is your auction. You can’t bid on it.</p>
      ) : initial.viewerId ? (
        <form id="auction-bid-form" action={submitBid} className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
          <input type="hidden" name="listingId" value={initial.listingId} />
          <label className="sr-only" htmlFor="bid-amount">
            Your bid in dollars
          </label>
          <input
            id="bid-amount"
            name="amount"
            inputMode="decimal"
            placeholder={`At least ${formatMoney(initial.minNextCents)}`}
            className="h-10 w-full rounded-lg border border-input bg-background px-3 sm:max-w-xs"
          />
          <button
            type="submit"
            className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground"
          >
            Place bid
          </button>
        </form>
      ) : (
        <Button className="mt-4 h-10" render={<Link href={`/login?next=/listings/${initial.listingId}`} />}>
          Sign in to bid
        </Button>
      )}
      {bidError ? (
        <p role="alert" className="mt-2 text-sm text-destructive">
          {bidError}
        </p>
      ) : null}
      {!ended && initial.viewerId ? (
        <p className="mt-2 text-xs text-muted-foreground">
          Minimum next bid {formatMoney(initial.minNextCents)}. The top bid refreshes every few seconds.
        </p>
      ) : null}

      <h3 className="mt-6 text-sm font-medium">Bid history</h3>
      {initial.bids.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">No bids yet.</p>
      ) : (
        <ol id="auction-history" className="mt-2 space-y-2">
          {initial.bids.map((bid, index) => (
            <li key={bid.id} className="flex items-baseline justify-between gap-3 text-sm">
              <span>
                <span className="font-medium">{bid.name}</span>
                <span className="text-muted-foreground"> · {bid.college}</span>
                {index === 0 ? <span className="text-yale"> · top</span> : null}
              </span>
              <span className="text-right">
                <span className="font-medium">{formatMoney(bid.amountCents)}</span>
                <span className="block text-xs text-muted-foreground">{formatDateTime(bid.createdAt)}</span>
              </span>
            </li>
          ))}
        </ol>
      )}
      <script dangerouslySetInnerHTML={{ __html: liveScript }} />
    </section>
  );
}

function formatRemaining(endsAt: string, now: number) {
  const ms = Date.parse(endsAt) - now;
  if (ms <= 0) return "Ended";
  const total = Math.floor(ms / 1000);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return `${hours}h ${String(minutes).padStart(2, "0")}m ${String(seconds).padStart(2, "0")}s`;
}
