import type {
  Category,
  Condition,
  ListingStatus,
  ListingType,
  OrderStatus,
  TicketType,
} from "@/lib/categories";
import type { College } from "@/lib/colleges";

export type User = {
  id: string;
  email: string;
  name: string;
  college: College;
  graduationYear: number;
  avatarUrl: string | null;
  createdAt: string;
};

export type Listing = {
  id: string;
  sellerId: string;
  title: string;
  description: string;
  priceCents: number;
  category: Category;
  ticketType: TicketType | null;
  photos: string[];
  condition: Condition;
  listingType: ListingType;
  status: ListingStatus;
  seniorMoveOut: boolean;
  /** Campus event slug from src/lib/events.ts, when this listing belongs to one. */
  event?: string | null;
  auctionEndsAt: string | null;
  /** Set when an auction closes with a high bidder. */
  auctionWinnerId?: string | null;
  createdAt: string;
};

export type Bid = {
  id: string;
  listingId: string;
  bidderId: string;
  amountCents: number;
  createdAt: string;
};

export type Conversation = {
  id: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  createdAt: string;
  buyerLastReadAt?: string;
  sellerLastReadAt?: string;
};

export type Message = {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  createdAt: string;
};

export type Order = {
  id: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  priceCents: number;
  status: OrderStatus;
  createdAt: string;
};

export type Courier = {
  userId: string;
  active: boolean;
  rating: number | null;
  createdAt: string;
};

export type DeliveryStatus = "open" | "accepted" | "completed" | "cancelled";

export type Delivery = {
  id: string;
  orderId: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  fromCollege: College;
  toCollege: College;
  feeCents: number;
  etaMinutes: number;
  courierId: string | null;
  status: DeliveryStatus;
  createdAt: string;
  acceptedAt: string | null;
};

export type Review = {
  id: string;
  orderId: string;
  reviewerId: string;
  sellerId: string;
  rating: number;
  body: string;
  createdAt: string;
};

export type StoreData = {
  version: 1;
  users: User[];
  listings: Listing[];
  bids: Bid[];
  conversations: Conversation[];
  messages: Message[];
  orders: Order[];
  reviews: Review[];
  couriers: Courier[];
  deliveries: Delivery[];
};
