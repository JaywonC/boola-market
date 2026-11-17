"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { isCollege } from "@/lib/colleges";
import { safeNextPath } from "@/lib/format";
import { insertUser } from "@/lib/db/store";
import { getUserByEmail } from "@/lib/db/queries";
import {
  clearPendingLogin,
  clearSession,
  readPendingLogin,
  setPendingLogin,
  setSession,
} from "@/features/auth/session";
import { sendSupabaseMagicLink, supabaseAuthConfigured, supabaseAuthSelected } from "@/features/auth/supabase";
import { isYaleEmail, normalizeEmail } from "@/features/auth/yale-email";

export type AuthState = { error: string };

const NAME = /^[\p{L}][\p{L} .'-]{1,59}$/u;

export async function requestMagicLink(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = normalizeEmail(String(formData.get("email") ?? ""));
  const next = safeNextPath(String(formData.get("next") ?? "/"));
  if (!isYaleEmail(email)) {
    return { error: "Use your @yale.edu address. Personal email isn’t accepted." };
  }

  if (supabaseAuthSelected() && supabaseAuthConfigured()) {
    const headerList = await headers();
    const host = headerList.get("x-forwarded-host") ?? headerList.get("host") ?? "localhost:3847";
    const proto = headerList.get("x-forwarded-proto") ?? "http";
    const sent = await sendSupabaseMagicLink(email, `${proto}://${host}`);
    if (!sent.ok) return { error: sent.error };
    redirect(`/login/check?mode=supabase&email=${encodeURIComponent(email)}`);
  }

  await setPendingLogin(email, next);
  redirect("/login/check");
}

export async function completeMagicLink(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const pending = await readPendingLogin();
  if (!pending || !isYaleEmail(pending.email)) {
    return { error: "That sign-in link expired. Request a new one." };
  }

  let user = await getUserByEmail(pending.email);
  if (!user) {
    const name = String(formData.get("name") ?? "").trim();
    const college = String(formData.get("college") ?? "");
    const year = Number(formData.get("graduationYear"));
    if (!NAME.test(name)) {
      return { error: "Enter the name other students should see." };
    }
    if (!isCollege(college)) {
      return { error: "Pick your residential college." };
    }
    if (!Number.isInteger(year) || year < 2026 || year > 2030) {
      return { error: "Class year should be between 2026 and 2030." };
    }
    const created = await insertUser({ email: pending.email, name, college, graduationYear: year });
    if (!created.ok) return { error: created.error };
    user = created.user;
  }

  await setSession(user.id);
  await clearPendingLogin();
  redirect(safeNextPath(pending.next));
}

export async function signOut() {
  await clearSession();
  redirect("/");
}
