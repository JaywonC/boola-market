import Link from "next/link";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { COLLEGE_COLORS } from "@/lib/colleges";
import type { User } from "@/lib/db/types";
import { classYear, initials } from "@/lib/format";
import { Stars } from "@/features/profiles/components/stars";

export function Person({
  user,
  rating = null,
  reviewCount,
  sales,
  href,
}: {
  user: User;
  rating?: number | null;
  reviewCount?: number;
  sales?: number;
  href?: string;
}) {
  const body = (
    <span className="flex min-w-0 items-center gap-3">
      <Avatar className="size-11">
        {user.avatarUrl ? <AvatarImage src={user.avatarUrl} alt="" /> : null}
        <AvatarFallback
          className="text-sm font-medium text-white"
          style={{ backgroundColor: COLLEGE_COLORS[user.college] }}
        >
          {initials(user.name)}
        </AvatarFallback>
      </Avatar>
      <span className="min-w-0">
        <span className="block truncate font-medium text-foreground">{user.name}</span>
        <span className="block truncate text-sm text-muted-foreground">
          {user.college} {classYear(user.graduationYear)}
          {typeof sales === "number" ? ` · ${sales} sale${sales === 1 ? "" : "s"}` : ""}
        </span>
        <Stars rating={rating} count={reviewCount} />
      </span>
    </span>
  );

  if (!href) return body;
  return (
    <Link href={href} className="rounded-lg outline-none hover:opacity-90 focus-visible:ring-3 focus-visible:ring-ring/50">
      {body}
    </Link>
  );
}
