import { getCurrentUser } from "@/features/auth/session";
import type { College } from "@/lib/colleges";
import type { Delivery } from "@/lib/db/types";
import { readStoreForRender } from "@/lib/db/store";

export type CourierCard = {
  userId: string;
  name: string;
  college: College;
  rating: number | null;
  active: boolean;
};

export type DeliveryOfferModel = {
  listingId: string;
  listingTitle: string;
  mode: "form" | "status" | "signin" | "winner-only";
  sellerCollege: College;
  sellerId: string;
  viewerCollege: College | null;
  viewerId: string | null;
  couriers: CourierCard[];
  delivery: (Delivery & { courier: CourierCard | null; listingTitle: string }) | null;
  winnerName: string | null;
};

export async function getDeliveryOffer(listingId: string): Promise<DeliveryOfferModel | null> {
  const store = await readStoreForRender();
  const listing = store.listings.find((item) => item.id === listingId);
  const seller = listing ? store.users.find((user) => user.id === listing.sellerId) : null;
  if (!listing || !seller) return null;
  if (listing.listingType === "auction" && listing.status === "active") return null;

  const viewer = await getCurrentUser();
  const couriers = courierCards(store);
  const delivery = store.deliveries.find(
    (item) => item.listingId === listing.id && item.status !== "cancelled" && (!viewer || item.buyerId === viewer.id || item.sellerId === viewer.id),
  );
  const winner = listing.auctionWinnerId
    ? store.users.find((user) => user.id === listing.auctionWinnerId)
    : null;

  let mode: DeliveryOfferModel["mode"] = "signin";
  if (delivery && viewer && (delivery.buyerId === viewer.id || delivery.sellerId === viewer.id)) {
    mode = "status";
  } else if (!viewer) {
    mode = listing.status === "sold" ? "winner-only" : "signin";
  } else if (viewer.id === seller.id) {
    mode = delivery ? "status" : "winner-only";
  } else if (listing.listingType === "fixed" && listing.status === "active") {
    mode = "form";
  } else if (listing.listingType === "auction" && listing.auctionWinnerId === viewer.id) {
    mode = "form";
  } else {
    mode = "winner-only";
  }

  return {
    listingId: listing.id,
    listingTitle: listing.title,
    mode,
    sellerCollege: seller.college,
    sellerId: seller.id,
    viewerCollege: viewer?.college ?? null,
    viewerId: viewer?.id ?? null,
    couriers,
    delivery: delivery
      ? {
          ...delivery,
          listingTitle: listing.title,
          courier: delivery.courierId ? couriers.find((courier) => courier.userId === delivery.courierId) ?? null : null,
        }
      : null,
    winnerName: winner?.name ?? null,
  };
}

export async function getCourierBoard() {
  const store = await readStoreForRender();
  const viewer = await getCurrentUser();
  const couriers = courierCards(store);
  const mine = viewer ? store.couriers.find((courier) => courier.userId === viewer.id && courier.active) : null;
  const jobs = store.deliveries
    .filter((delivery) => delivery.status === "open" || delivery.status === "accepted" || delivery.status === "completed")
    .map((delivery) => decorate(store, delivery, couriers))
    .filter((delivery) => delivery !== null);
  const open = jobs.filter(
    (job) => job.status === "open" && job.buyerId !== viewer?.id && job.sellerId !== viewer?.id,
  );
  const mineJobs = viewer ? jobs.filter((job) => job.courierId === viewer.id) : [];
  const earningsCents = mineJobs
    .filter((job) => job.status === "accepted" || job.status === "completed")
    .reduce((sum, job) => sum + job.feeCents, 0);
  return {
    viewer,
    isCourier: Boolean(mine),
    rating: mine?.rating ?? null,
    open,
    mineJobs,
    earningsCents,
  };
}

function courierCards(store: Awaited<ReturnType<typeof readStoreForRender>>): CourierCard[] {
  return store.couriers.flatMap((courier) => {
    const person = store.users.find((user) => user.id === courier.userId);
    if (!person) return [];
    return [
      {
        userId: person.id,
        name: person.name,
        college: person.college,
        rating: courier.rating,
        active: courier.active,
      },
    ];
  });
}

function decorate(
  store: Awaited<ReturnType<typeof readStoreForRender>>,
  delivery: Delivery,
  couriers: CourierCard[],
) {
  const listing = store.listings.find((item) => item.id === delivery.listingId);
  if (!listing) return null;
  return {
    ...delivery,
    listingTitle: listing.title,
    courier: delivery.courierId ? couriers.find((courier) => courier.userId === delivery.courierId) ?? null : null,
  };
}
