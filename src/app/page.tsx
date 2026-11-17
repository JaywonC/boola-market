import Link from "next/link";
import { Suspense } from "react";

import { Button } from "@/components/ui/button";
import { CardGridSkeleton } from "@/components/layout/skeletons";
import { ListingArt } from "@/features/listings/components/listing-art";
import { ListingGrid } from "@/features/listings/components/listing-card";
import { CATEGORY_IDS, CATEGORY_LABELS } from "@/lib/categories";
import { getHomeFeed } from "@/lib/db/queries";
import { formatRating } from "@/lib/format";

export default function HomePage() {
  return (
    <div>
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(280px,0.9fr)] lg:py-16">
        <div>
          <p className="text-xs font-medium tracking-[0.18em] text-brass uppercase">The trusted campus market</p>
          <h1 className="mt-3 max-w-xl font-serif text-4xl leading-[1.05] text-yale sm:text-6xl">
            The ticket that never hits the group chat.
          </h1>
          <p className="mt-4 max-w-xl text-lg leading-7 text-muted-foreground">
            Yale Marketplace is only for @yale.edu. Every seller has a residential college, a class year, and a rating from students who already bought from them — whether it’s The Game, a YSO seat, or a mini-fridge on the third floor of Pierson.
          </p>
          <form action="/browse" className="mt-6 flex flex-col gap-2 sm:flex-row">
            <label className="sr-only" htmlFor="home-search">
              Search listings
            </label>
            <input
              id="home-search"
              name="q"
              placeholder="Search tickets, textbooks, mini-fridges"
              className="h-11 w-full rounded-lg border border-input bg-card px-3 text-sm"
            />
            <Button type="submit" className="h-11 px-4">
              Search
            </Button>
          </form>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button variant="outline" className="h-10 bg-card px-4" render={<Link href="/browse?category=tickets&ticket=harvard_yale" />}>
              Harvard–Yale tickets
            </Button>
            <Button variant="ghost" className="h-10 px-4" render={<Link href="/listings/new" />}>
              Sell something
            </Button>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          <Link href="/listings/lst_game_student" className="overflow-hidden rounded-2xl shadow-lg ring-1 ring-black/10">
            <ListingArt category="tickets" ticketType="harvard_yale" title="The Game" />
          </Link>
          <Link href="/listings/lst_yso_halloween" className="-mt-8 ml-8 hidden overflow-hidden rounded-2xl shadow-lg ring-1 ring-black/10 sm:block lg:ml-16">
            <ListingArt category="tickets" ticketType="yso" title="YSO Halloween" />
          </Link>
        </div>
      </section>

      <Suspense fallback={<HomeFallback />}>
        <HomeFeed />
      </Suspense>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="font-serif text-3xl text-yale">How a sale stays honest</h2>
        <ol className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            ["1", "Sign in with @yale.edu", "Personal email is rejected. The other side of the deal is a student."],
            ["2", "Read the seller, not just the price", "College, class year, completed sales, and reviews from buyers."],
            ["3", "Hand it off on campus", "Meet between classes. Resco-to-resco delivery is the next piece."],
          ].map(([step, title, body]) => (
            <li key={step} className="rounded-xl border border-border bg-card p-5">
              <p className="font-serif text-3xl text-brass">{step}</p>
              <h3 className="mt-2 font-medium">{title}</h3>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">{body}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

async function HomeFeed() {
  const feed = await getHomeFeed();
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-12 px-4">
      <dl className="grid grid-cols-2 gap-3 rounded-2xl border border-border bg-card p-4 sm:grid-cols-4">
        <Stat label="Verified students" value={String(feed.stats.students)} />
        <Stat label="Active listings" value={String(feed.stats.activeListings)} />
        <Stat label="Completed sales" value={String(feed.stats.completedSales)} />
        <Stat label="Average rating" value={formatRating(feed.stats.averageRating) ?? "—"} />
      </dl>

      <section>
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <h2 className="font-serif text-3xl text-yale">Hard to find</h2>
            <p className="text-sm text-muted-foreground">YSO, The Game, and the other tickets that disappear.</p>
          </div>
          <Link href="/browse?category=tickets" className="text-sm font-medium text-yale hover:underline">
            All tickets
          </Link>
        </div>
        <ListingGrid cards={feed.featured} />
      </section>

      <section>
        <h2 className="font-serif text-3xl text-yale">Browse by shelf</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {CATEGORY_IDS.map((category) => (
            <Link
              key={category}
              href={category === "tickets" ? "/browse?category=tickets" : `/browse?category=${category}`}
              className="rounded-xl border border-border bg-card px-3 py-4 text-center text-sm font-medium hover:border-yale"
            >
              {CATEGORY_LABELS[category]}
            </Link>
          ))}
        </div>
      </section>

      <section className="rounded-2xl bg-yale px-5 py-6 text-primary-foreground sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-serif text-3xl">Senior move-out</h2>
            <p className="mt-1 max-w-xl text-sm text-primary-foreground/80">
              Graduating seniors listing the loft, the rug, and the rest of the room. Filter anything marked move-out.
            </p>
          </div>
          <Button variant="secondary" className="h-10" render={<Link href="/move-out" />}>
            See move-out sales
          </Button>
        </div>
        <div className="mt-5">
          <ListingGrid cards={feed.moveOut} />
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between gap-3">
          <h2 className="font-serif text-3xl text-yale">Just listed</h2>
          <Link href="/browse" className="text-sm font-medium text-yale hover:underline">
            Browse everything
          </Link>
        </div>
        <ListingGrid cards={feed.fresh} />
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs tracking-wide text-muted-foreground uppercase">{label}</dt>
      <dd className="mt-1 font-serif text-3xl text-yale">{value}</dd>
    </div>
  );
}

function HomeFallback() {
  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4">
      <div className="h-24 animate-pulse rounded-2xl bg-muted" />
      <CardGridSkeleton count={3} />
    </div>
  );
}
