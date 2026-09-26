import crypto from "node:crypto";
import jwt from "jsonwebtoken";

const ACCESS_SECRET = process.env.JWT_SECRET ?? "";
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET ?? "";

if (!ACCESS_SECRET || !REFRESH_SECRET) {
  throw new Error("Faltan JWT_SECRET / JWT_REFRESH_SECRET en backend/.env");
}

export interface AccessPayload {
  sub: string;
}

export function signAccess(userId: string): string {
  return jwt.sign({ sub: userId } satisfies AccessPayload, ACCESS_SECRET, { expiresIn: "15m" });
}

/** Refresh opaco (no JWT): se guarda hasheado en BD y rota en cada uso. */
export function newRefreshToken(): { token: string; hash: string } {
  const token = crypto.randomBytes(48).toString("hex");
  const hash = crypto.createHash("sha256").update(token).digest("hex");
  return { token, hash };
}

export function hashRefresh(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function verifyAccess(token: string): AccessPayload {
  return jwt.verify(token, ACCESS_SECRET) as AccessPayload;
}

export function refreshExpiry(): Date {
  return new Date(Date.now() + 7 * 86_400_000);
}
