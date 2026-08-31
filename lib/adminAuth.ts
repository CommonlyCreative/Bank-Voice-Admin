import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

export const ADMIN_SESSION_COOKIE = "admin_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 8;

function getSecret(): string {
    const secret = process.env.ADMIN_SESSION_SECRET;
    if (!secret) throw new Error("ADMIN_SESSION_SECRET is not set");
    return secret;
}

function sign(payload: string): string {
    return createHmac("sha256", getSecret()).update(payload).digest("hex");
}

function safeEqual(a: string, b: string): boolean {
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);
    if (bufA.length !== bufB.length) return false;
    return timingSafeEqual(bufA, bufB);
}

export function verifyAdminCredentials(username: string, password: string): boolean {
    const expectedUsername = process.env.ADMIN_USERNAME ?? "";
    const expectedPassword = process.env.ADMIN_PASSWORD ?? "";
    if (!expectedUsername || !expectedPassword) return false;
    return safeEqual(username, expectedUsername) && safeEqual(password, expectedPassword);
}

export function createSessionToken(): string {
    const payload = `admin.${Date.now() + SESSION_TTL_MS}`;
    return `${payload}.${sign(payload)}`;
}

export function isSessionTokenValid(token: string | undefined): boolean {
    if (!token) return false;
    const parts = token.split(".");
    if (parts.length !== 3) return false;
    const [subject, expiry, signature] = parts;
    if (!safeEqual(signature, sign(`${subject}.${expiry}`))) return false;
    return Date.now() < Number(expiry);
}

export async function isAdminAuthenticated(): Promise<boolean> {
    const store = await cookies();
    return isSessionTokenValid(store.get(ADMIN_SESSION_COOKIE)?.value);
}
