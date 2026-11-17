export const CATEGORY_IDS = [
  "tickets",
  "furniture",
  "textbooks",
  "electronics",
  "clothing",
  "other",
] as const;

export type Category = (typeof CATEGORY_IDS)[number];

export const TICKET_TYPES = ["yso", "harvard_yale", "concerts", "other"] as const;

export type TicketType = (typeof TICKET_TYPES)[number];

export const CONDITIONS = ["new", "like_new", "good", "fair"] as const;

export type Condition = (typeof CONDITIONS)[number];

export const LISTING_TYPES = ["fixed", "auction"] as const;

export type ListingType = (typeof LISTING_TYPES)[number];

export const LISTING_STATUSES = ["active", "sold", "cancelled"] as const;

export type ListingStatus = (typeof LISTING_STATUSES)[number];

export const ORDER_STATUSES = ["pending", "completed", "cancelled"] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const CATEGORY_LABELS: Record<Category, string> = {
  tickets: "Tickets",
  furniture: "Furniture",
  textbooks: "Textbooks",
  electronics: "Electronics",
  clothing: "Clothing",
  other: "Other",
};

export const TICKET_LABELS: Record<TicketType, string> = {
  yso: "YSO",
  harvard_yale: "Harvard–Yale",
  concerts: "Concerts",
  other: "Other tickets",
};

export const CONDITION_LABELS: Record<Condition, string> = {
  new: "New",
  like_new: "Like new",
  good: "Good",
  fair: "Fair",
};

export function isCategory(value: string): value is Category {
  return (CATEGORY_IDS as readonly string[]).includes(value);
}

export function isTicketType(value: string): value is TicketType {
  return (TICKET_TYPES as readonly string[]).includes(value);
}

export function isCondition(value: string): value is Condition {
  return (CONDITIONS as readonly string[]).includes(value);
}

export function isListingType(value: string): value is ListingType {
  return (LISTING_TYPES as readonly string[]).includes(value);
}

export function categoryLabel(category: Category, ticketType: TicketType | null) {
  if (category === "tickets" && ticketType) {
    return `${CATEGORY_LABELS.tickets} · ${TICKET_LABELS[ticketType]}`;
  }
  return CATEGORY_LABELS[category];
}
