'use client'

import { useActionState } from 'react';
import { adminLogin, type AdminLoginState } from '@/app/lib/adminActions';
import { Input } from '@/components/ui/input';
import { Field, FieldGroup } from '@/components/ui/field';
import { Label } from '@/components/ui/label';

const initialState: AdminLoginState = {};

export default function LoginForm() {
    const [state, formAction, pending] = useActionState(adminLogin, initialState);

    return (
        <form action={formAction} className="space-y-4">
            <FieldGroup>
                <Field>
                    <Label htmlFor="username">Username</Label>
                    <Input id="username" name="username" autoComplete="username" required autoFocus />
                </Field>
                <Field>
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" name="password" type="password" autoComplete="current-password" required />
                </Field>
            </FieldGroup>
            {state.error && (
                <p className="text-sm font-medium text-red-600">{state.error}</p>
            )}
            <button
                type="submit"
                disabled={pending}
                className="w-full cursor-pointer rounded-lg bg-[#CC0000] px-3.5 py-2 text-sm font-bold text-white transition-all hover:bg-[#AA0000] active:scale-95 disabled:opacity-60"
            >
                {pending ? 'Signing in...' : 'Sign In'}
            </button>
        </form>
    );
}
