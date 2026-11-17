"use client";

import { Button } from "@/components/ui/button";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center">
      <h1 className="font-serif text-4xl text-yale">The marketplace hit a snag</h1>
      <p className="mt-3 text-muted-foreground">
        Refresh and try again. If the local data file got corrupted, delete data/store.json and the demo seed will rebuild.
      </p>
      <Button type="button" className="mt-6 h-10 px-4" onClick={() => reset()}>
        Try again
      </Button>
    </div>
  );
}
