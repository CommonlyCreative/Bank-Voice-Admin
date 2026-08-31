'use server'

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_SESSION_COOKIE, createSessionToken, verifyAdminCredentials } from "@/lib/adminAuth";

export type AdminLoginState = { error?: string };

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

export async function adminLogout() {
    const store = await cookies();
    store.delete({ name: ADMIN_SESSION_COOKIE, path: "/admin" });
    redirect("/admin/login");
}
