import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center">
      <h1 className="font-serif text-4xl text-yale">That page isn’t on campus</h1>
      <p className="mt-3 text-muted-foreground">The listing or profile may have moved. Browse what’s still for sale.</p>
      <Button className="mt-6 h-10 px-4" render={<Link href="/browse" />}>
        Browse listings
      </Button>
    </div>
  );
}
