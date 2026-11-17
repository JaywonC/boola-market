/**
 * Real magic-link delivery. Used only when AUTH_PROVIDER=supabase and both
 * NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set.
 * The code exchange still lives in src/app/auth/callback/route.ts.
 */
export function supabaseAuthSelected() {
  return process.env.AUTH_PROVIDER === "supabase";
}

export function supabaseAuthConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export async function sendSupabaseMagicLink(email: string, origin: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return {
      ok: false as const,
      error:
        "AUTH_PROVIDER=supabase is set, but NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is missing.",
    };
  }
  const endpoint = new URL("/auth/v1/otp", url);
  endpoint.searchParams.set("redirect_to", `${origin}/auth/callback`);
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, create_user: true }),
  });
  if (!response.ok) {
    return {
      ok: false as const,
      error: "Yale email was accepted, but Supabase did not send the magic link.",
    };
  }
  return { ok: true as const };
}
