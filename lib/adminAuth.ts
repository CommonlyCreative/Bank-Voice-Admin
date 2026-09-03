import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

/**
 * Admin auth: stateless, signed-cookie sessions (no session table/store).
 * A session cookie is `<subject>.<expiryMs>.<HMAC-SHA256 of "subject.expiryMs">`, signed with
 * ADMIN_SESSION_SECRET. Anyone can read/copy the cookie's contents, but forging or altering it
 * (e.g. extending the expiry) requires knowing the secret, since the signature won't match.
 */

export const ADMIN_SESSION_COOKIE = "admin_session";
/** How long a session stays valid after login before requiring re-authentication. */
const SESSION_TTL_MS = 1000 * 60 * 60 * 8;

/** Reads the signing secret from env, failing loudly if it was never configured. */
function getSecret(): string {
    const secret = process.env.ADMIN_SESSION_SECRET;
    if (!secret) throw new Error("ADMIN_SESSION_SECRET is not set");
    return secret;
}

/** HMAC-SHA256 of `payload` using the app's session secret, hex-encoded. */
function sign(payload: string): string {
    return createHmac("sha256", getSecret()).update(payload).digest("hex");
}

/** Constant-time string comparison, to avoid leaking match length/position via response timing. */
function safeEqual(a: string, b: string): boolean {
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);
    if (bufA.length !== bufB.length) return false;
    return timingSafeEqual(bufA, bufB);
}

/** Checks a submitted username/password against ADMIN_USERNAME/ADMIN_PASSWORD from .env. */
export function verifyAdminCredentials(username: string, password: string): boolean {
    const expectedUsername = process.env.ADMIN_USERNAME ?? "";
    const expectedPassword = process.env.ADMIN_PASSWORD ?? "";
    if (!expectedUsername || !expectedPassword) return false;
    return safeEqual(username, expectedUsername) && safeEqual(password, expectedPassword);
}

/** Builds a new signed, expiring session token to store in the admin_session cookie after login. */
export function createSessionToken(): string {
    const payload = `admin.${Date.now() + SESSION_TTL_MS}`;
    return `${payload}.${sign(payload)}`;
}

/** Verifies a session token's signature (proves it wasn't forged/tampered) and that it hasn't expired. */
export function isSessionTokenValid(token: string | undefined): boolean {
    if (!token) return false;
    const parts = token.split(".");
    if (parts.length !== 3) return false;
    const [subject, expiry, signature] = parts;
    if (!safeEqual(signature, sign(`${subject}.${expiry}`))) return false;
    return Date.now() < Number(expiry);
}

/** Convenience check used by /admin routes to gate access: reads the request's cookie and validates it. */
export async function isAdminAuthenticated(): Promise<boolean> {
    const store = await cookies();
    return isSessionTokenValid(store.get(ADMIN_SESSION_COOKIE)?.value);
}
