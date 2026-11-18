import type { College } from "@/lib/colleges";

/** Rough campus positions. Distance is between residential colleges, not a street map. */
const POSITION: Record<College, { x: number; y: number }> = {
  Saybrook: { x: 0, y: 0 },
  Branford: { x: 1, y: 0 },
  "Jonathan Edwards": { x: 0, y: 1 },
  Trumbull: { x: 1, y: 1 },
  Berkeley: { x: 2, y: 0 },
  Pierson: { x: 2, y: 1 },
  Davenport: { x: 3, y: 0.4 },
  "Timothy Dwight": { x: 3.2, y: 1.3 },
  Silliman: { x: 1.2, y: 2.2 },
  "Grace Hopper": { x: 4.4, y: 1.2 },
  "Benjamin Franklin": { x: 4.6, y: 2.2 },
  "Pauli Murray": { x: 5.2, y: 1.4 },
  Morse: { x: 5.4, y: 3.2 },
  "Ezra Stiles": { x: 6.1, y: 3.3 },
};

export type DeliveryQuote = {
  fromCollege: College;
  toCollege: College;
  distance: number;
  feeCents: number;
  etaMinutes: number;
};

export function quoteDelivery(fromCollege: College, toCollege: College): DeliveryQuote {
  const from = POSITION[fromCollege];
  const to = POSITION[toCollege];
  const distance = Math.hypot(to.x - from.x, to.y - from.y);
  let feeCents = 500;
  if (distance <= 2.2) feeCents = 300;
  else if (distance <= 4) feeCents = 400;
  const etaMinutes = Math.min(50, Math.max(20, Math.round(15 + distance * 6)));
  return { fromCollege, toCollege, distance, feeCents, etaMinutes };
}

export function recommendCourier<T extends { userId: string; college: College; rating: number | null; active: boolean }>(
  couriers: T[],
  toCollege: College,
  excludeUserIds: string[],
) {
  const options = couriers.filter((courier) => courier.active && !excludeUserIds.includes(courier.userId));
  options.sort((a, b) => {
    const distance = quoteDelivery(a.college, toCollege).distance - quoteDelivery(b.college, toCollege).distance;
    if (Math.abs(distance) > 0.05) return distance;
    return (b.rating ?? 0) - (a.rating ?? 0);
  });
  return options[0] ?? null;
}
