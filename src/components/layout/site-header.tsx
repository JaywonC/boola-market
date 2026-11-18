import Link from "next/link";
import { Suspense } from "react";

import { Button } from "@/components/ui/button";
import { MobileNav } from "@/components/layout/mobile-nav";
import { UserMenu } from "@/components/layout/user-menu";
import { getCurrentUser } from "@/features/auth/session";
import { MessagesNavLink } from "@/features/messages/components/messages-nav-link";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-card/90 backdrop-blur-md">
      <div className="bg-yale text-primary-foreground">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2 text-xs tracking-wide">
          <p>Verified @yale.edu students only</p>
          <p className="hidden sm:block">The Game is at the Bowl · November 21</p>
        </div>
      </div>
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid size-9 place-items-center rounded-lg bg-yale font-serif text-lg text-primary-foreground">
            Y
          </span>
          <span className="font-serif text-xl tracking-tight text-yale">Boola Market</span>
        </Link>
        <nav className="ml-4 hidden items-center gap-5 text-sm md:flex">
          <Link href="/browse" className="hover:text-yale">
            Browse
          </Link>
          <Link href="/browse?event=harvard-yale" className="hover:text-yale">
            Harvard–Yale
          </Link>
          <Link href="/browse?event=yso" className="hover:text-yale">
            YSO
          </Link>
          <Link href="/browse?event=senior-move-out" className="hover:text-yale">
            Senior move-out
          </Link>
          <Link href="/couriers" className="hover:text-yale">
            Couriers
          </Link>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <Button
            className="hidden h-9 px-3 sm:inline-flex"
            render={<Link href="/listings/new" />}
          >
            Sell
          </Button>
          <Suspense fallback={<div className="h-9 w-24 animate-pulse rounded-lg bg-muted" />}>
            <HeaderAuth />
          </Suspense>
        </div>
      </div>
    </header>
  );
}

async function HeaderAuth() {
  const user = await getCurrentUser();
  return (
    <>
      {user ? (
        <>
          <Suspense fallback={null}>
            <MessagesNavLink />
          </Suspense>
          <UserMenu user={{ id: user.id, name: user.name }} />
        </>
      ) : (
        <Button variant="outline" className="h-9 px-3" render={<Link href="/login" />}>
          Sign in
        </Button>
      )}
      <MobileNav signedIn={Boolean(user)} />
    </>
  );
}
