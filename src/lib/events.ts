import type { TicketType } from "@/lib/categories";

/** One-time or seasonal campus events. Browse and the home banner read this list. */
export type CampusEvent = {
  id: string;
  name: string;
  /** Calendar date, YYYY-MM-DD. */
  date: string;
  active: boolean;
  blurb: string;
};

export const CAMPUS_EVENTS: CampusEvent[] = [
  {
    id: "harvard-yale",
    name: "Harvard–Yale",
    date: "2026-11-21",
    active: true,
    blurb: "The Game is at the Bowl this Saturday. Student tickets and pairs.",
  },
  {
    id: "yso",
    name: "YSO",
    date: "2026-10-31",
    active: true,
    blurb: "Woolsey seats that leave the official sale before most of campus sees them.",
  },
  {
    id: "senior-move-out",
    name: "Senior move-out",
    date: "2027-05-16",
    active: true,
    blurb: "Lofts, rugs, and the rest of a room that will not fit in the car home.",
  },
];

export function isEventId(value: string): boolean {
  return CAMPUS_EVENTS.some((event) => event.id === value);
}

export function getEvent(id: string | null | undefined) {
  return CAMPUS_EVENTS.find((event) => event.id === id) ?? null;
}

export function activeEvents() {
  return CAMPUS_EVENTS.filter((event) => event.active);
}

export function derivedEventId(listing: {
  ticketType: TicketType | null;
  seniorMoveOut: boolean;
  event?: string | null;
}) {
  if (listing.event) return listing.event;
  if (listing.ticketType === "harvard_yale") return "harvard-yale";
  if (listing.ticketType === "yso") return "yso";
  if (listing.seniorMoveOut) return "senior-move-out";
  return null;
}

export function formatEventDate(date: string) {
  const parsed = new Date(`${date}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(parsed);
}
