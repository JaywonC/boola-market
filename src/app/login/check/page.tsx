import Link from "next/link";
import { Suspense } from "react";

import { CheckForm } from "@/features/auth/components/check-form";
import { readPendingLogin } from "@/features/auth/session";
import { getUserByEmail } from "@/lib/db/queries";

export const metadata = { title: "Check your email" };

export default function CheckPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <Suspense fallback={<div className="mx-auto max-w-md px-4 py-16 text-sm text-muted-foreground">Opening the link…</div>}>
      <CheckBody searchParams={searchParams} />
    </Suspense>
  );
}

async function CheckBody({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const mode = Array.isArray(params.mode) ? params.mode[0] : params.mode;
  const supabaseEmail = Array.isArray(params.email) ? params.email[0] : params.email;

  if (mode === "supabase") {
    return (
      <div className="mx-auto max-w-md px-4 py-16">
        <h1 className="font-serif text-3xl text-yale">Check your Yale inbox</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          A magic link was requested for {supabaseEmail || "your @yale.edu address"}. The return trip still needs the session exchange in the auth callback before it can sign you in.
        </p>
        <Link href="/login" className="mt-6 inline-block text-sm font-medium text-yale hover:underline">
          Back to sign in
        </Link>
      </div>
    );
  }

  const pending = await readPendingLogin();
  if (!pending) {
    return (
      <div className="mx-auto max-w-md px-4 py-16">
        <h1 className="font-serif text-3xl text-yale">That link expired</h1>
        <p className="mt-3 text-sm text-muted-foreground">Request another one. Demo links last 15 minutes.</p>
        <Link href="/login" className="mt-6 inline-block text-sm font-medium text-yale hover:underline">
          Request a new link
        </Link>
      </div>
    );
  }

  const existing = await getUserByEmail(pending.email);
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <p className="text-xs tracking-[0.16em] text-brass uppercase">Demo mode</p>
      <h1 className="mt-2 font-serif text-3xl text-yale">Confirm {pending.email}</h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        No email left this machine. This button is the magic link. {existing ? `Welcome back, ${existing.name.split(" ")[0]}.` : "New students add a college and class year once."}
      </p>
      <div className="mt-6">
        <CheckForm existing={Boolean(existing)} />
      </div>
    </div>
  );
}
