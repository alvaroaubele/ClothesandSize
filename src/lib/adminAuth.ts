import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE = "wardrobe_admin";
const DEV_PASSCODE = "shanai-rhea";

export function isProduction(): boolean {
  return process.env.NODE_ENV === "production" && !!process.env.VERCEL;
}

export function adminPasscode(): string | null {
  const p = process.env.ADMIN_PASSCODE?.trim();
  if (p) return p;
  return isProduction() ? null : DEV_PASSCODE;
}

function secret(): string {
  const s = process.env.ADMIN_SECRET?.trim();
  if (s) return s;
  return createHash("sha256").update(`wardrobe:${adminPasscode() ?? ""}`).digest("hex");
}

function expectedCookieValue(): string {
  return createHmac("sha256", secret()).update("admin-session-v1").digest("base64url");
}

export function passcodeMatches(candidate: string): boolean {
  const expected = adminPasscode();
  if (!expected) return false;
  const a = Buffer.from(candidate);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function setAdminSession(): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIE, expectedCookieValue(), {
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction(),
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearAdminSession(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export async function isAdmin(): Promise<boolean> {
  const jar = await cookies();
  const v = jar.get(COOKIE)?.value;
  if (!v) return false;
  const a = Buffer.from(v);
  const b = Buffer.from(expectedCookieValue());
  return a.length === b.length && timingSafeEqual(a, b);
}
