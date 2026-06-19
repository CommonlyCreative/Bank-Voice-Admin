'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import {
    SERVICE_TYPES,
    CALL_REASONS,
    ACTION_OPTIONS,
    VERIFICATION_METHODS,
    type ServiceTypeValue,
    type VerificationMethod,
} from '@/app/lib/notationData';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectSeparator,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';

const textareaClass =
    'w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm ' +
    'transition-colors outline-none placeholder:text-muted-foreground resize-none leading-relaxed ' +
    'focus-visible:outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50';

export default function NotationForm() {
    const [serviceType, setServiceType] = useState<ServiceTypeValue | ''>('');
    const [callReason, setCallReason] = useState('');
    const [customerGoal, setCustomerGoal] = useState('');
    const [verification, setVerification] = useState<VerificationMethod | ''>('');
    const [selectedActions, setSelectedActions] = useState<string[]>([]);
    const [customReason, setCustomReason] = useState('');
    const [customActionChecked, setCustomActionChecked] = useState(false);
    const [customAction, setCustomAction] = useState('');
    const [copied, setCopied] = useState(false);

    const notationRef = useRef<HTMLDivElement>(null);

    const availableReasons = serviceType ? CALL_REASONS[serviceType] : [];
    const availableActions = callReason ? (ACTION_OPTIONS[callReason] ?? []) : [];
    const selectedReasonLabel = availableReasons.find(r => r.value === callReason)?.label ?? '';
    const selectedServiceLabel = SERVICE_TYPES.find(s => s.value === serviceType)?.label ?? '';

    const handleServiceChange = (value: string | null) => {
        setServiceType(value as ServiceTypeValue);
        setCallReason('');
        setSelectedActions([]);
        setVerification('');
        setCustomReason('');
        setCustomActionChecked(false);
        setCustomAction('');
    };

    const handleReasonChange = (value: string | null) => {
        setCallReason(value ?? "");
        setSelectedActions([]);
        if (value !== 'custom') setCustomReason('');
    };

    const toggleAction = (value: string) => {
        setSelectedActions(prev =>
            prev.includes(value) ? prev.filter(a => a !== value) : [...prev, value]
        );
    };

    const handleReset = () => {
        setServiceType('');
        setCallReason('');
        setCustomerGoal('');
        setVerification('');
        setSelectedActions([]);
        setCustomReason('');
        setCustomActionChecked(false);
        setCustomAction('');
        setCopied(false);
    };

    const actionsText = useMemo(() => {
        const labels = selectedActions.map(
            a => availableActions.find(opt => opt.value === a)?.label ?? a
        );
        if (customActionChecked && customAction.trim()) labels.push(customAction.trim());
        return labels.length === 0 ? 'set expectations' : labels.join(', ');
    }, [selectedActions, availableActions, customActionChecked, customAction]);

    const notation = useMemo(() => {
        if (!serviceType || !callReason) return '';
        const reasonText =
            callReason === 'custom' ? customReason.trim() : selectedReasonLabel;
        if (!reasonText) return '';
        const goal = customerGoal.trim();
        const lines: string[] = [
            `1. ${selectedServiceLabel}`,
            `2. CCI about ${reasonText}`,
        ];
        if (goal) lines.push(`3. ${goal}`);
        const actionLine = verification ? `${verification} ${actionsText}` : actionsText;
        lines.push(`${goal ? '4' : '3'}. ${actionLine}`);
        return lines.join('\n');
    }, [serviceType, callReason, customReason, selectedServiceLabel, selectedReasonLabel, customerGoal, verification, actionsText]);

    // Scroll notation into view when it first appears
    useEffect(() => {
        if (notation && notationRef.current) {
            notationRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [!!notation]);

    const copyToClipboard = async () => {
        if (!notation) return;
        await navigator.clipboard.writeText(notation);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const step2Visible = !!serviceType;
    const step3Visible = !!callReason;
    const step4Visible = !!callReason;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Top bar */}
            <header className="bg-[#CC0000] px-6 py-3 flex items-center justify-between shadow-md">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-white rounded-sm flex items-center justify-center">
                            <div className="w-4 h-4 bg-[#CC0000] rounded-sm" />
                        </div>
                        <span className="text-white font-bold text-base tracking-tight">Bank Voice Admin</span>
                    </div>
                    <span className="text-red-300 text-xs font-medium hidden sm:block">
                        · High Priority · Notation Builder
                    </span>
                </div>
                <button
                    onClick={handleReset}
                    className="text-xs cursor-pointer font-semibold text-red-100 border border-red-300 px-3 py-1.5 rounded-lg hover:bg-red-700 transition-colors"
                >
                    New Call
                </button>
            </header>

            <main className="max-w-2xl mx-auto py-8 px-4 space-y-4">
                {/* ── Notation Form Card ── */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-6 pt-5 pb-4 border-b border-gray-100">
                        <h1 className="text-sm font-semibold text-gray-700">Customer Notation</h1>
                        <p className="text-xs text-gray-400 mt-0.5">
                            Each section shapes the one below — fill top to bottom.
                        </p>
                    </div>

                    <div className="px-6 py-5 space-y-6">
                        {/* ── Step 1: Service Type ── */}
                        <Section step={1} label="Type of Servicing">
                            <Select value={serviceType || null} onValueChange={handleServiceChange}>
                                <SelectTrigger className="w-full h-9 text-sm">
                                    <SelectValue placeholder="Select service type…" />
                                </SelectTrigger>
                                <SelectContent>
                                    {SERVICE_TYPES.map(s => (
                                        <SelectItem key={s.value} value={s.value}>
                                            {s.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </Section>

                        {/* ── Step 2: Call Reason ── */}
                        {step2Visible && (
                            <>
                                <Divider />
                                <Section step={2} label="Call Reason">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-sm text-gray-600 font-medium shrink-0">
                                            CCI about
                                        </span>
                                        <Select value={callReason || null} onValueChange={handleReasonChange}>
                                            <SelectTrigger className="h-9 text-sm w-auto min-w-48 flex-1">
                                                <SelectValue placeholder="select a reason…" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {availableReasons.map(r => (
                                                    <SelectItem key={r.value} value={r.value}>
                                                        {r.label}
                                                    </SelectItem>
                                                ))}
                                                <SelectSeparator />
                                                <SelectItem value="custom">Custom…</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    {callReason === 'custom' && (
                                        <Input
                                            value={customReason}
                                            onChange={e => setCustomReason(e.target.value)}
                                            placeholder="Type the custom reason…"
                                            className="mt-1 h-9 text-sm"
                                            autoFocus
                                        />
                                    )}
                                </Section>
                            </>
                        )}

                        {/* ── Step 3: Customer Goal ── */}
                        {step3Visible && (
                            <Section step={3} label="Customer's Goal">
                                <textarea
                                    value={customerGoal}
                                    onChange={e => setCustomerGoal(e.target.value)}
                                    placeholder="Describe what result the customer was looking for…"
                                    rows={3}
                                    className={textareaClass}
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                    Optional — leave blank to omit from notation.
                                </p>
                            </Section>
                        )}

                        {/* ── Step 4: Verification + Actions ── */}
                        {step4Visible && (
                            <>
                                <Divider />
                                <Section step={4} label="Verification & Actions">
                                    {/* CIV pill row */}
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-sm font-semibold text-gray-600 shrink-0">CIV:</span>
                                        <div className="flex gap-2 items-center flex-wrap">
                                            <button
                                                type="button"
                                                onClick={() => setVerification('')}
                                                className={`px-3 py-1 rounded-full text-sm font-bold border-2 transition-all ${!verification
                                                        ? 'bg-[#CC0000] border-[#CC0000] text-white shadow-sm'
                                                        : 'bg-white border-gray-200 text-gray-500 hover:border-[#CC0000] hover:text-[#CC0000]'
                                                    }`}
                                            >
                                                Standard
                                            </button>
                                            <span className="text-gray-300 text-xs font-semibold tracking-wide">High:</span>
                                            {VERIFICATION_METHODS.map(method => (
                                                <button
                                                    key={method}
                                                    type="button"
                                                    onClick={() => setVerification(verification === method ? '' : method)}
                                                    className={`px-3 py-1 rounded-full text-sm font-bold border-2 transition-all ${verification === method
                                                            ? 'bg-[#CC0000] border-[#CC0000] text-white shadow-sm'
                                                            : 'bg-white border-gray-200 text-gray-500 hover:border-[#CC0000] hover:text-[#CC0000]'
                                                        }`}
                                                >
                                                    {method}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="mt-4 pl-11">
                                        {availableActions.length > 0 ? (
                                            <div className="space-y-2.5">
                                                <p className="text-xs text-muted-foreground -mt-1">
                                                    Select action(s) taken — defaults to{' '}
                                                    <span className="italic">set expectations</span> if none selected.
                                                </p>
                                                {availableActions.map(action => (
                                                    <CheckboxItem
                                                        key={action.value}
                                                        checked={selectedActions.includes(action.value)}
                                                        onToggle={() => toggleAction(action.value)}
                                                        label={action.label}
                                                    />
                                                ))}
                                                {selectedActions.length === 0 && !customActionChecked && (
                                                    <p className="text-xs text-muted-foreground italic pt-1">
                                                        → Will use{' '}
                                                        <span className="font-medium not-italic">set expectations</span>
                                                    </p>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                                                <span className="w-2 h-2 rounded-full bg-gray-300 shrink-0" />
                                                <span className="italic">set expectations</span>
                                            </div>
                                        )}

                                        {/* Custom action — always available */}
                                        <div
                                            className={`space-y-2 ${availableActions.length > 0
                                                    ? 'mt-2 pt-2 border-t border-dashed border-gray-200'
                                                    : ''
                                                }`}
                                        >
                                            <CheckboxItem
                                                checked={customActionChecked}
                                                onToggle={() => setCustomActionChecked(v => !v)}
                                                label="Custom"
                                            />
                                            {customActionChecked && (
                                                <Input
                                                    value={customAction}
                                                    onChange={e => setCustomAction(e.target.value)}
                                                    placeholder="Type custom action…"
                                                    className="h-9 text-sm"
                                                    autoFocus
                                                />
                                            )}
                                        </div>
                                    </div>
                                </Section>
                            </>
                        )}
                    </div>
                </div>

                {/* ── Generated Notation ── */}
                {notation && (
                    <div
                        ref={notationRef}
                        className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
                    >
                        <div className="flex items-center justify-between px-6 py-3 bg-gray-50 border-b border-gray-100">
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Generated Notation
                            </span>
                            <button
                                onClick={copyToClipboard}
                                className={`flex cursor-pointer items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold tracking-wide transition-all ${copied
                                        ? 'bg-green-500 text-white'
                                        : 'bg-[#CC0000] text-white hover:bg-[#AA0000] active:scale-95'
                                    }`}
                            >
                                {copied ? (
                                    <>
                                        <svg className="w-3 h-3" viewBox="0 0 12 10" fill="none">
                                            <path
                                                d="M1 5l4 4 6-8"
                                                stroke="currentColor"
                                                strokeWidth="1.8"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            />
                                        </svg>
                                        Copied!
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-3 h-3" viewBox="0 0 12 14" fill="none">
                                            <rect x="4" y="4" width="7" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
                                            <path
                                                d="M8 4V2.5A1.5 1.5 0 006.5 1h-5A1.5 1.5 0 000 2.5v9A1.5 1.5 0 001.5 13H4"
                                                stroke="currentColor"
                                                strokeWidth="1.5"
                                                strokeLinecap="round"
                                            />
                                        </svg>
                                        Copy
                                    </>
                                )}
                            </button>
                        </div>

                        <div className="px-6 py-5">
                            <pre className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap font-sans">
                                {notation}
                            </pre>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

function Section({
    step,
    label,
    children,
}: {
    step: number;
    label: string;
    children: React.ReactNode;
}) {
    return (
        <div className="flex items-start gap-3">
            <span className="shrink-0 w-5 h-5 rounded-full bg-[#CC0000] text-white text-[10px] font-bold flex items-center justify-center mt-0.5">
                {step}
            </span>
            <div className="flex-1 space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{label}</p>
                {children}
            </div>
        </div>
    );
}

function Divider() {
    return <div className="border-t border-dashed border-gray-200 ml-8" />;
}

function CheckboxItem({
    checked,
    onToggle,
    label,
}: {
    checked: boolean;
    onToggle: () => void;
    label: string;
}) {
    return (
        <div className="flex items-center gap-2.5 cursor-pointer group" onClick={onToggle}>
            <span
                className={`w-4 h-4 rounded border-2 shrink-0 flex items-center justify-center transition-colors ${checked ? 'bg-[#CC0000] border-[#CC0000]' : 'border-gray-300 group-hover:border-[#CC0000]'
                    }`}
            >
                {checked && (
                    <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 8" fill="none">
                        <path
                            d="M1 4l3 3 5-6"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                )}
            </span>
            <span
                className={`text-sm transition-colors select-none ${checked ? 'text-gray-900 font-medium' : 'text-gray-500 group-hover:text-gray-700'
                    }`}
            >
                {label}
            </span>
        </div>
    );
}
