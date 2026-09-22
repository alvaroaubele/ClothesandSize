import { randomBytes } from "node:crypto";

/** 144-bit URL-safe token for a guest's private planner link. */
export function newGuestToken(): string {
  return randomBytes(18).toString("base64url");
}
