export function formatMoney(cents: number) {
  const hasCents = cents % 100 !== 0;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: hasCents ? 2 : 0,
  }).format(cents / 100);
}

export function formatRating(value: number | null) {
  if (value == null) return null;
  return value.toFixed(1);
}

export function classYear(year: number) {
  return `’${String(year).slice(-2)}`;
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  const letters = parts.map((part) => part[0]?.toUpperCase() ?? "").join("");
  return letters || "?";
}

export function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(iso));
}

export function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function formatAuctionEnd(iso: string | null, now = Date.now()) {
  if (!iso) return "No end time";
  const end = Date.parse(iso);
  if (Number.isNaN(end)) return "No end time";
  if (end <= now) return "Auction ended";
  const hours = Math.max(1, Math.round((end - now) / 36e5));
  if (hours < 48) return `Ends in ${hours} hour${hours === 1 ? "" : "s"}`;
  const days = Math.round(hours / 24);
  return `Ends in ${days} days`;
}

export function safeNextPath(value: string | null | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return "/";
  }
  return value;
}
