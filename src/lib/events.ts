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

export function eventDate(date: string) {
  const parsed = new Date(`${date}T12:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function formatEventDate(date: string) {
  const parsed = eventDate(date);
  if (!parsed) return date;
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(parsed);
}

/** Whole calendar days from today in New Haven until the event date. */
export function daysUntil(date: string, now = new Date()) {
  const [year, month, day] = date.split("-").map(Number);
  if (!year || !month || !day) return null;
  const target = Date.UTC(year, month - 1, day, 12);
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
      .formatToParts(now)
      .map((part) => [part.type, part.value]),
  );
  const today = Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day), 12);
  return Math.round((target - today) / 86_400_000);
}

export function formatEventWeekday(date: string) {
  const parsed = eventDate(date);
  if (!parsed) return "";
  return new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(parsed);
}
