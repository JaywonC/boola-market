"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { signOut } from "@/features/auth/actions";

export function UserMenu({ user }: { user: { id: string; name: string } }) {
  const first = user.name.split(" ")[0] ?? user.name;
  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" className="h-9 px-3" render={<Link href={`/profile/${user.id}`} />}>
        {first}
      </Button>
      <form action={signOut}>
        <Button type="submit" variant="ghost" className="h-9 px-2">
          Sign out
        </Button>
      </form>
    </div>
  );
}
