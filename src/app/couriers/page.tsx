import Link from "next/link";
import { Suspense } from "react";

import { Button } from "@/components/ui/button";
import { optInAsCourier, takeDelivery } from "@/features/delivery/actions";
import { getCourierBoard } from "@/features/delivery/queries";
import { Stars } from "@/features/profiles/components/stars";
import { formatMoney } from "@/lib/format";

export const metadata = { title: "Couriers" };

export default function CouriersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <Suspense fallback={<div className="mx-auto max-w-3xl px-4 py-10 text-sm text-muted-foreground">Loading courier board…</div>}>
      <CourierBody searchParams={searchParams} />
    </Suspense>
  );
}

async function CourierBody({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const board = await getCourierBoard();
  const error = first(params.error);
  const accepted = first(params.accepted) === "1";
  const joined = first(params.joined) === "1";

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <p className="text-xs font-medium tracking-[0.16em] text-brass uppercase">Resco to resco</p>
      <h1 className="mt-2 font-serif text-4xl text-yale">Become a courier</h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Walk a purchase from one residential college to another. You keep the delivery fee. Open handoffs are listed below.
      </p>
      {error ? (
        <p role="alert" className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}
      {accepted ? <p className="mt-4 text-sm">You accepted the handoff. Head to the seller’s college.</p> : null}
      {joined ? <p className="mt-4 text-sm">You’re on the courier list.</p> : null}

      {!board.viewer ? (
        <Button className="mt-6 h-10 px-4" render={<Link href="/login?next=/couriers" />}>
          Sign in to courier
        </Button>
      ) : !board.isCourier ? (
        <form action={optInAsCourier} className="mt-6">
          <Button type="submit" className="h-10 px-4">
            Become a courier
          </Button>
        </form>
      ) : (
        <dl className="mt-6 grid grid-cols-2 gap-3 rounded-xl border border-border bg-card p-4">
          <div>
            <dt className="text-xs tracking-wide text-muted-foreground uppercase">Earnings</dt>
            <dd className="font-serif text-3xl text-yale">{formatMoney(board.earningsCents)}</dd>
          </div>
          <div>
            <dt className="text-xs tracking-wide text-muted-foreground uppercase">Rating</dt>
            <dd className="mt-2">
              <Stars rating={board.rating} />
            </dd>
          </div>
        </dl>
      )}

      <section className="mt-8">
        <h2 className="font-serif text-2xl text-yale">Open requests</h2>
        {board.open.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">Nothing is waiting right now.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {board.open.map((job) => (
              <li key={job.id} className="rounded-xl border border-border bg-card p-4">
                <p className="font-medium">{job.listingTitle}</p>
                <p className="text-sm text-muted-foreground">
                  {job.fromCollege} → {job.toCollege} · {formatMoney(job.feeCents)} · about {job.etaMinutes} min
                </p>
                {board.isCourier ? (
                  <form action={takeDelivery} className="mt-3">
                    <input type="hidden" name="deliveryId" value={job.id} />
                    <Button type="submit" className="h-9 px-3">
                      Accept
                    </Button>
                  </form>
                ) : (
                  <p className="mt-2 text-xs text-muted-foreground">Opt in to accept this walk.</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {board.mineJobs.length > 0 ? (
        <section className="mt-8">
          <h2 className="font-serif text-2xl text-yale">Your handoffs</h2>
          <ul className="mt-3 space-y-3">
            {board.mineJobs.map((job) => (
              <li key={job.id} className="rounded-xl border border-border bg-card p-4 text-sm">
                <p className="font-medium">{job.listingTitle}</p>
                <p className="text-muted-foreground">
                  {job.fromCollege} → {job.toCollege} · {formatMoney(job.feeCents)} · {job.status}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}
