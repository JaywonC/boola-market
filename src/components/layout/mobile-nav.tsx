"use client";

import Link from "next/link";
import { Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const links = [
  { href: "/browse", label: "Browse" },
  { href: "/browse?category=tickets&ticket=harvard_yale", label: "Harvard–Yale" },
  { href: "/browse?category=tickets&ticket=yso", label: "YSO" },
  { href: "/move-out", label: "Senior move-out" },
  { href: "/listings/new", label: "Sell something" },
];

export function MobileNav({ signedIn }: { signedIn: boolean }) {
  return (
    <Sheet>
      <SheetTrigger
        render={
          <Button variant="outline" size="icon" className="md:hidden" aria-label="Open menu" />
        }
      >
        <Menu />
      </SheetTrigger>
      <SheetContent side="left" className="bg-card">
        <SheetHeader>
          <SheetTitle className="font-serif text-yale">Yale Marketplace</SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col gap-1 px-4">
          {links.map((link) => (
            <SheetClose
              key={link.href}
              render={<Link href={link.href} className="rounded-lg px-2 py-2 text-base hover:bg-muted" />}
            >
              {link.label}
            </SheetClose>
          ))}
          {signedIn ? null : (
            <SheetClose
              render={<Link href="/login" className="rounded-lg px-2 py-2 text-base hover:bg-muted" />}
            >
              Sign in
            </SheetClose>
          )}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
