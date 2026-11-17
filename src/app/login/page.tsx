import { Suspense } from "react";

import { LoginForm } from "@/features/auth/components/login-form";

export const metadata = { title: "Sign in" };

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <Suspense fallback={<div className="mx-auto max-w-md px-4 py-16 text-sm text-muted-foreground">Loading sign-in…</div>}>
      <LoginScreen searchParams={searchParams} />
    </Suspense>
  );
}

async function LoginScreen({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const next = first(params.next) || "/";
  const error = first(params.error);
  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 lg:grid-cols-2 lg:py-16">
      <div className="rounded-2xl bg-yale p-8 text-primary-foreground">
        <p className="text-xs tracking-[0.18em] uppercase text-primary-foreground/70">Yale only</p>
        <h1 className="mt-3 font-serif text-4xl leading-tight">Sign in with the address the university gave you.</h1>
        <p className="mt-4 max-w-md text-sm leading-6 text-primary-foreground/80">
          @yale.edu only. On this machine the magic link is confirmed on the next screen, so you can demo the market without an inbox. Set the Supabase variables in the README when you want a real email.
        </p>
      </div>
      <div>
        {error === "supabase_callback" ? (
          <p role="alert" className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            Supabase sent you back, but the session exchange in the callback route is still a plug-in. Use demo mode, or finish src/app/auth/callback/route.ts.
          </p>
        ) : null}
        <LoginForm next={next} />
      </div>
    </div>
  );
}

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}
