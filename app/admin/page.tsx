import { redirect } from 'next/navigation';
import { isAdminAuthenticated } from '@/lib/adminAuth';
import { adminLogout } from '@/app/lib/adminActions';
import { db, Report } from '@/lib/mongo';
import AdminPanel, { type ServiceNotations } from './AdminPanel';

type StoredNotation = {
    service?: string;
    serviceType?: string;
    reports?: Report[];
};

export default async function AdminPage() {
    if (!(await isAdminAuthenticated())) redirect('/admin/login');

    const documents = await db.collection<StoredNotation>('reported-notations').find().toArray();
    const notations: ServiceNotations[] = documents.map(doc => ({
        id: String(doc._id),
        service: doc.service ?? doc.serviceType ?? 'Unknown service',
        reports: doc.reports ?? [],
    }));

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="sticky top-0 flex items-center justify-between bg-[#CC0000] px-6 py-3 shadow-md">
                <span className="text-base font-bold tracking-tight text-white">Admin Panel · Reported Notations</span>
                <form action={adminLogout}>
                    <button
                        type="submit"
                        className="cursor-pointer rounded-lg border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-100 transition-colors hover:bg-red-700"
                    >
                        Sign Out
                    </button>
                </form>
            </header>
            <main className="mx-auto max-w-3xl px-4 py-8">
                <AdminPanel notations={notations} />
            </main>
        </div>
    );
}
