'use client';

import { useState } from 'react';
import type { Report } from '@/lib/mongo';

export type ServiceNotations = {
    id: string;
    service: string;
    reports: Report[];
};

export default function AdminPanel({ notations }: { notations: ServiceNotations[] }) {
    const [selectedId, setSelectedId] = useState(notations[0]?.id ?? '');
    const selected = notations.find(n => n.id === selectedId) ?? notations[0];

    if (notations.length === 0) {
        return (
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <p className="text-sm text-gray-400">No reported notations yet.</p>
            </div>
        );
    }

    return (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center gap-2 overflow-x-auto border-b border-gray-100 bg-gray-50 px-4 py-2.5">
                {notations.map(n => (
                    <button
                        key={n.id}
                        type="button"
                        onClick={() => setSelectedId(n.id)}
                        className={`cursor-pointer shrink-0 rounded-full border-2 px-3 py-1 text-xs font-bold whitespace-nowrap transition-all ${selected?.id === n.id
                            ? 'border-[#CC0000] bg-[#CC0000] text-white shadow-sm'
                            : 'border-gray-200 bg-white text-gray-500 hover:border-[#CC0000] hover:text-[#CC0000]'
                            }`}
                    >
                        {n.service}
                        <span className={`ml-1.5 ${selected?.id === n.id ? 'text-red-100' : 'text-gray-400'}`}>
                            {n.reports.length}
                        </span>
                    </button>
                ))}
            </div>

            <div className="divide-y divide-gray-100">
                {selected && selected.reports.length === 0 && (
                    <p className="px-6 py-4 text-sm text-gray-400">No reports for this service yet.</p>
                )}
                {selected?.reports.map((report, i) => (
                    <div key={i} className="space-y-1.5 px-6 py-4">
                        <p className="text-xs font-semibold text-gray-400">EID: {report.eid}</p>
                        <p className="text-sm text-gray-700"><span className="font-medium text-gray-500">Reason:</span> {report.reason}</p>
                        <p className="text-sm text-gray-700"><span className="font-medium text-gray-500">Action:</span> {report.action}</p>
                        <details className="group">
                            <summary className="cursor-pointer text-xs font-medium text-gray-500 select-none hover:text-gray-700">
                                Full Note
                            </summary>
                            <pre className="mt-1.5 whitespace-pre-wrap rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-800">{report.fullNote}</pre>
                        </details>
                    </div>
                ))}
            </div>
        </div>
    );
}
