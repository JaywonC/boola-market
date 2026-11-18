import Link from "next/link";
import { Suspense } from "react";

import { Button } from "@/components/ui/button";
import { CardGridSkeleton } from "@/components/layout/skeletons";
import { ListingArt } from "@/features/listings/components/listing-art";
import { ListingGrid } from "@/features/listings/components/listing-card";
import { CATEGORY_IDS, CATEGORY_LABELS } from "@/lib/categories";
import { getHomeFeed } from "@/lib/db/queries";
import { daysUntil, formatEventDate, formatEventWeekday, getEvent } from "@/lib/events";

export default function HomePage() {
  return (
    <div>
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(280px,0.9fr)] lg:py-16">
        <div>
          <h1 className="max-w-xl font-serif text-4xl leading-[1.05] text-yale sm:text-6xl">
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
            <Button variant="outline" className="h-10 bg-card px-4" render={<Link href="/browse?event=harvard-yale" />}>
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
      <GameCountdown />

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

      {feed.events.length > 0 ? (
        <section className="rounded-2xl border border-border bg-card px-5 py-6 sm:px-8">
          <h2 className="font-serif text-3xl text-yale">On campus now</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Seasonal shelves. Each one is a filtered browse view, not its own page.
          </p>
          <ul className="mt-4 grid gap-3 md:grid-cols-3">
            {feed.events.map((event) => (
              <li key={event.id}>
                <Link
                  href={`/browse?event=${event.id}`}
                  className="block h-full rounded-xl bg-yale px-4 py-4 text-primary-foreground hover:bg-yale/90"
                >
                  <p className="text-xs tracking-[0.14em] text-primary-foreground/70 uppercase">
                    {formatEventDate(event.date)}
                  </p>
                  <p className="mt-1 font-serif text-2xl">{event.name}</p>
                  <p className="mt-2 text-sm text-primary-foreground/80">{event.blurb}</p>
                  <p className="mt-3 text-sm font-medium">
                    {event.count} listing{event.count === 1 ? "" : "s"}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

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

function GameCountdown() {
  const event = getEvent("harvard-yale");
  if (!event) return null;
  const days = daysUntil(event.date);
  if (days === null) return null;
  const when =
    days > 1
      ? `Harvard–Yale is in ${days} days`
      : days === 1
        ? "Harvard–Yale is tomorrow"
        : days === 0
          ? "Harvard–Yale is today"
          : `Harvard–Yale was ${formatEventDate(event.date)}`;
  return (
    <p className="text-base text-yale">
      <Link href="/browse?event=harvard-yale" className="font-medium hover:underline">
        {when}
      </Link>
      <span className="text-muted-foreground">
        {" "}
        · {formatEventWeekday(event.date)} at the Bowl
      </span>
    </p>
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
