import { NextResponse } from "next/server";

/**
 * Supabase magic-link return.
 * Finish the PKCE / code exchange here, confirm the email is @yale.edu,
 * upsert the profile, then set the ym_session cookie from src/features/auth/session.ts.
 * Until that lands, the route sends people back to the login page instead of
 * creating a half-signed-in session.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  if (!code) {
    return NextResponse.redirect(new URL("/login?error=missing_code", url.origin));
  }
  return NextResponse.redirect(new URL("/login?error=supabase_callback", url.origin));
}
