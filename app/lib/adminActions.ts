'use server'

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_SESSION_COOKIE, createSessionToken, verifyAdminCredentials } from "@/lib/adminAuth";

/** Return type of adminLogin, used with React's useActionState to surface a form error. */
export type AdminLoginState = { error?: string };

/**
 * Server Action bound to the admin login form (see app/admin/login/LoginForm.tsx).
 * On success, sets the signed admin_session cookie (httpOnly so client JS can't read/tamper
 * with it, scoped to /admin so it's never sent on other routes) and redirects into /admin.
 */
export async function adminLogin(_prevState: AdminLoginState, formData: FormData): Promise<AdminLoginState> {
    const username = String(formData.get("username") ?? "");
    const password = String(formData.get("password") ?? "");

    if (!verifyAdminCredentials(username, password)) {
        return { error: "Invalid username or password." };
    }

    const store = await cookies();
    store.set(ADMIN_SESSION_COOKIE, createSessionToken(), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/admin",
        maxAge: 60 * 60 * 8,
    });

    redirect("/admin");
}

/** Clears the admin session cookie and sends the rep back to the login screen. */
export async function adminLogout() {
    const store = await cookies();
    store.delete({ name: ADMIN_SESSION_COOKIE, path: "/admin" });
    redirect("/admin/login");
}
