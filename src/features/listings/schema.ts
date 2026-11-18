import { z } from "zod";

import {
  CATEGORY_IDS,
  CONDITIONS,
  isTicketType,
  LISTING_TYPES,
  type Category,
  type Condition,
  type ListingType,
  type TicketType,
} from "@/lib/categories";
import { derivedEventId, isEventId } from "@/lib/events";

export type ListingInput = {
  title: string;
  description: string;
  priceCents: number;
  category: Category;
  ticketType: TicketType | null;
  condition: Condition;
  listingType: ListingType;
  seniorMoveOut: boolean;
  event: string | null;
  auctionEndsAt: string | null;
};

export type ListingParse =
  | { ok: true; data: ListingInput }
  | { ok: false; error: string; fieldErrors: Record<string, string> };

const formSchema = z.object({
  title: z.string().trim().min(4, "Give the listing a title of at least 4 characters.").max(90),
  description: z
    .string()
    .trim()
    .min(20, "Add a sentence or two so a buyer knows what they’re getting.")
    .max(2000),
  price: z.string().trim().min(1, "Enter a price."),
  category: z.enum(CATEGORY_IDS, { error: "Pick a category." }),
  ticketType: z.string().optional(),
  condition: z.enum(CONDITIONS, { error: "Pick a condition." }),
  listingType: z.enum(LISTING_TYPES, { error: "Pick fixed price or auction." }),
  auctionEndsAt: z.string().optional(),
  seniorMoveOut: z.boolean(),
});

export function parseListingForm(formData: FormData): ListingParse {
  const parsed = formSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    price: formData.get("price"),
    category: formData.get("category"),
    ticketType: String(formData.get("ticketType") ?? ""),
    condition: formData.get("condition"),
    listingType: formData.get("listingType"),
    auctionEndsAt: String(formData.get("auctionEndsAt") ?? ""),
    seniorMoveOut: formData.get("seniorMoveOut") === "on",
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return {
      ok: false,
      error: "Check the highlighted fields.",
      fieldErrors,
    };
  }

  const value = parsed.data;
  const amount = Number(value.price);
  if (!Number.isFinite(amount) || amount <= 0 || amount >= 10000) {
    return {
      ok: false,
      error: "Enter a price between $1 and $9,999.",
      fieldErrors: { price: "Enter a price between $1 and $9,999." },
    };
  }

  let ticketType: TicketType | null = null;
  if (value.category === "tickets") {
    if (!value.ticketType || !isTicketType(value.ticketType)) {
      return {
        ok: false,
        error: "Ticket listings need a type: YSO, Harvard–Yale, concerts, or other.",
        fieldErrors: { ticketType: "Pick the kind of ticket." },
      };
    }
    ticketType = value.ticketType;
  }

  let auctionEndsAt: string | null = null;
  if (value.listingType === "auction") {
    const parsedEnd = value.auctionEndsAt ? new Date(value.auctionEndsAt) : null;
    if (!parsedEnd || Number.isNaN(parsedEnd.getTime()) || parsedEnd.getTime() <= Date.now()) {
      return {
        ok: false,
        error: "An auction needs an end time in the future.",
        fieldErrors: { auctionEndsAt: "Pick an end time in the future." },
      };
    }
    auctionEndsAt = parsedEnd.toISOString();
  }

  return {
    ok: true,
    data: {
      title: value.title,
      description: value.description,
      priceCents: Math.round(amount * 100),
      category: value.category,
      ticketType,
      condition: value.condition,
      listingType: value.listingType,
      seniorMoveOut: value.seniorMoveOut,
      event:
        (isEventId(String(formData.get("event") ?? "")) ? String(formData.get("event")) : null) ??
        derivedEventId({ ticketType, seniorMoveOut: value.seniorMoveOut }),
      auctionEndsAt,
    },
  };
}
