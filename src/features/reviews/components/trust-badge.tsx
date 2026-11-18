import { BadgeCheck } from "lucide-react";

import { Stars } from "@/features/profiles/components/stars";
import { cn } from "cn";

export function TrustBadge({
  rating,
  sales,
  className,
}: {
  rating: number | null;
  sales: number;
  className?: string;
}) {
  const salesLabel = sales === 0 ? "No sales yet" : sales === 1 ? "1 sale" : `${sales} sales`;
  return (
    <span
      className={cn(
        "inline-flex max-w-full flex-wrap items-center gap-x-1.5 gap-y-1 rounded-full border border-border bg-paper px-2 py-1 text-xs text-muted-foreground",
        className,
      )}
    >
      <Stars rating={rating} />
      <span aria-hidden className="text-border">
        ·
      </span>
      <span>{salesLabel}</span>
      <span aria-hidden className="text-border">
        ·
      </span>
      <span className="inline-flex items-center gap-0.5 font-medium text-yale">
        <BadgeCheck className="size-3.5" aria-hidden />
        Verified
      </span>
    </span>
  );
}
