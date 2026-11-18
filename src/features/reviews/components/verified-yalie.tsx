import { BadgeCheck } from "lucide-react";

/** Every account on the market is an @yale.edu student, so the badge is college plus class year. */
export function VerifiedYalie({
  college,
  graduationYear,
}: {
  college: string;
  graduationYear: number;
}) {
  return (
    <div className="mt-4 inline-flex items-center gap-3 rounded-xl border border-yale/15 bg-secondary px-3 py-2">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-yale text-primary-foreground">
        <BadgeCheck className="size-5" aria-hidden />
      </span>
      <span>
        <span className="block text-sm font-medium text-yale">Verified Yalie</span>
        <span className="block text-xs text-muted-foreground">
          {college} · Class of {graduationYear}
        </span>
      </span>
    </div>
  );
}
