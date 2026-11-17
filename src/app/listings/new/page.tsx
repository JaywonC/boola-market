import { redirect } from "next/navigation";
import { Suspense } from "react";

import { getCurrentUser } from "@/features/auth/session";
import { ListingForm } from "@/features/listings/components/listing-form";

export const metadata = { title: "Sell something" };

export default function NewListingPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-3xl px-4 py-10 text-sm text-muted-foreground">Loading the form…</div>}>
      <NewListingBody />
    </Suspense>
  );
}

async function NewListingBody() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/listings/new");
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="font-serif text-4xl text-yale">Sell something</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        You’re listing as {user.name}, {user.college} ’{String(user.graduationYear).slice(-2)}. Buyers will see your college and rating on the listing.
      </p>
      <div className="mt-8">
        <ListingForm />
      </div>
    </div>
  );
}
