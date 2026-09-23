import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const COOKIE = "wardrobe_admin";
const DEV_PASSCODE = "shanai-rhea";

/** Any production build counts, not only Vercel: a self-hosted deploy must not fall back to the dev passcode. */
export function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
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

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

export function passcodeMatches(candidate: string): boolean {
  const expected = adminPasscode();
  return !!expected && safeEqual(candidate, expected);
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
  if (!adminPasscode()) return false;
  const jar = await cookies();
  const v = jar.get(COOKIE)?.value;
  return !!v && safeEqual(v, expectedCookieValue());
}

/**
 * Call at the top of every admin page and inside every query that returns guest
 * data. A layout-level check is not enough: Next renders the page in parallel
 * with the layout, so a redirect there still streams the page body.
 */
export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) redirect("/admin/login");
}
