import { redirect } from 'next/navigation';
import { isAdminAuthenticated } from '@/lib/adminAuth';
import LoginForm from './LoginForm';

export default async function AdminLoginPage() {
    if (await isAdminAuthenticated()) redirect('/admin');

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
            <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <h1 className="text-sm font-semibold text-gray-700">Admin Sign In</h1>
                <p className="mt-0.5 text-xs text-gray-400">Sign in to view reported notations.</p>
                <div className="mt-5">
                    <LoginForm />
                </div>
            </div>
        </div>
    );
}
