import { cookies } from "next/headers";
import { connection } from "next/server";

import { getUserById } from "@/lib/db/queries";
import { readToken, signToken } from "@/features/auth/token";

export const SESSION_COOKIE = "ym_session";
export const PENDING_COOKIE = "ym_pending";

const WEEK = 60 * 60 * 24 * 14;
const PENDING_MINUTES = 60 * 15;

type SessionPayload = { uid: string; exp: number };
type PendingPayload = { email: string; next: string; exp: number };

function cookieBase() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    secure: process.env.NODE_ENV === "production",
  };
}

export async function setSession(userId: string) {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, signToken({ uid: userId, exp: Date.now() + WEEK * 1000 }), {
    ...cookieBase(),
    maxAge: WEEK,
  });
}

export async function clearSession() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

export async function setPendingLogin(email: string, next: string) {
  const jar = await cookies();
  jar.set(
    PENDING_COOKIE,
    signToken({ email, next, exp: Date.now() + PENDING_MINUTES * 1000 }),
    { ...cookieBase(), maxAge: PENDING_MINUTES },
  );
}

export async function clearPendingLogin() {
  const jar = await cookies();
  jar.delete(PENDING_COOKIE);
}

export async function readPendingLogin() {
  await connection();
  const jar = await cookies();
  return readToken<PendingPayload>(jar.get(PENDING_COOKIE)?.value, Date.now());
}

export async function getCurrentUser() {
  await connection();
  const jar = await cookies();
  const payload = readToken<SessionPayload>(jar.get(SESSION_COOKIE)?.value, Date.now());
  if (!payload?.uid) return null;
  return getUserById(payload.uid);
}
