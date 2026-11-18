import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-border bg-yale text-primary-foreground">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-serif text-xl">Yale Marketplace</p>
          <p className="mt-1 max-w-md text-sm text-primary-foreground/80">
            A campus market for students with a @yale.edu address. Student couriers walk purchases from one residential college to another.
          </p>
        </div>
        <div className="flex gap-4 text-sm">
          <Link href="/browse" className="hover:underline">
            Browse
          </Link>
          <Link href="/browse?event=senior-move-out" className="hover:underline">
            Move-out
          </Link>
          <Link href="/couriers" className="hover:underline">
            Couriers
          </Link>
          <Link href="/listings/new" className="hover:underline">
            Sell
          </Link>
        </div>
      </div>
    </footer>
  );
}
