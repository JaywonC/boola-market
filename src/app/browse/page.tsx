import { Suspense, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { CardGridSkeleton } from "@/components/layout/skeletons";
import { ListingGrid } from "@/features/listings/components/listing-card";
import {
  CATEGORY_IDS,
  CATEGORY_LABELS,
  TICKET_LABELS,
  TICKET_TYPES,
  isCategory,
  isTicketType,
} from "@/lib/categories";
import { COLLEGES, isCollege } from "@/lib/colleges";
import { queryListings, type BrowseFilters } from "@/lib/db/queries";
import { CAMPUS_EVENTS, formatEventDate, getEvent, isEventId } from "@/lib/events";

export const metadata = { title: "Browse" };

type Search = Record<string, string | string[] | undefined>;

export default function BrowsePage({ searchParams }: { searchParams: Promise<Search> }) {
  return (
    <Suspense fallback={<div className="mx-auto max-w-6xl px-4 py-8"><CardGridSkeleton count={6} /></div>}>
      <BrowseResults searchParams={searchParams} />
    </Suspense>
  );
}

async function BrowseResults({ searchParams }: { searchParams: Promise<Search> }) {
  const raw = await searchParams;
  const filters = readFilters(raw);
  const cards = await queryListings(filters);
  const event = filters.event ? getEvent(filters.event) : null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-4xl text-yale">{event ? event.name : "Browse"}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {event
              ? `${formatEventDate(event.date)} · ${event.active ? "On now" : "Not on the banner"} · ${event.blurb}`
              : `${cards.length} listing${cards.length === 1 ? "" : "s"} from verified students.`}
          </p>
          {event ? (
            <p className="mt-1 text-sm text-muted-foreground">
              {cards.length} listing{cards.length === 1 ? "" : "s"}.
            </p>
          ) : null}
        </div>
      </div>

      <form action="/browse" className="mt-6 grid gap-3 rounded-xl border border-border bg-card p-4 md:grid-cols-6">
        <label className="md:col-span-2">
          <span className="mb-1 block text-xs font-medium tracking-wide text-muted-foreground uppercase">Search</span>
          <input name="q" defaultValue={filters.q ?? ""} placeholder="Title, college, seller" className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm" />
        </label>
        <Select name="category" label="Category" defaultValue={filters.category ?? ""}>
          <option value="">All</option>
          {CATEGORY_IDS.map((category) => (
            <option key={category} value={category}>
              {CATEGORY_LABELS[category]}
            </option>
          ))}
        </Select>
        <Select name="ticket" label="Tickets" defaultValue={filters.ticket ?? ""}>
          <option value="">Any ticket</option>
          {TICKET_TYPES.map((ticket) => (
            <option key={ticket} value={ticket}>
              {TICKET_LABELS[ticket]}
            </option>
          ))}
        </Select>
        <Select name="college" label="Seller’s college" defaultValue={filters.college ?? ""}>
          <option value="">Any college</option>
          {COLLEGES.map((college) => (
            <option key={college} value={college}>
              {college}
            </option>
          ))}
        </Select>
        <Select name="event" label="Event" defaultValue={filters.event ?? ""}>
          <option value="">Any event</option>
          {CAMPUS_EVENTS.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </Select>
        <Select name="sort" label="Sort" defaultValue={filters.sort ?? "newest"}>
          <option value="newest">Newest</option>
          <option value="price_asc">Price, low to high</option>
          <option value="price_desc">Price, high to low</option>
        </Select>
        <div className="flex flex-wrap items-center gap-4 md:col-span-4">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="moveout" value="1" defaultChecked={filters.moveout === "1"} />
            Senior move-out
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" name="type" value="" defaultChecked={!filters.type} />
            Any price type
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" name="type" value="fixed" defaultChecked={filters.type === "fixed"} />
            Fixed
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" name="type" value="auction" defaultChecked={filters.type === "auction"} />
            Auction
          </label>
        </div>
        <div className="flex items-end md:col-span-2 md:justify-end">
          <Button type="submit" className="h-10 px-4">
            Apply
          </Button>
        </div>
      </form>

      <div className="mt-6">
        <ListingGrid cards={cards} />
      </div>
    </div>
  );
}

function Select({
  name,
  label,
  defaultValue,
  children,
}: {
  name: string;
  label: string;
  defaultValue: string;
  children: ReactNode;
}) {
  return (
    <label>
      <span className="mb-1 block text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</span>
      <select name={name} defaultValue={defaultValue} className="h-10 w-full rounded-lg border border-input bg-background px-2 text-sm">
        {children}
      </select>
    </label>
  );
}

function readFilters(raw: Search): BrowseFilters {
  const one = (key: string) => {
    const value = raw[key];
    return Array.isArray(value) ? value[0] : value;
  };
  const category = one("category") ?? "";
  const ticket = one("ticket") ?? "";
  const college = one("college") ?? "";
  const type = one("type") ?? "";
  const sort = one("sort") ?? "";
  return {
    q: one("q") ?? "",
    category: isCategory(category) ? category : "",
    ticket: isTicketType(ticket) ? ticket : "",
    college: isCollege(college) ? college : "",
    type: type === "fixed" || type === "auction" ? type : "",
    sort: sort === "price_asc" || sort === "price_desc" ? sort : "newest",
    moveout: one("moveout") === "1" ? "1" : "",
    event: isEventId(one("event") ?? "") ? one("event") : "",
  };
}
