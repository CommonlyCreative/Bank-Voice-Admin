'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
    SERVICE_TYPES,
    CALL_REASONS,
    ACTION_OPTIONS,
    VERIFICATION_METHODS,
    ESCALATION_TRIGGERS,
    type ServiceTypeValue,
    type VerificationMethod,
    type Variables,
    type EscalationTrigger,
    CallReasonValue,
} from '@/app/lib/notationData';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

import { Combobox } from '@/components/ui/combobox';
import { Input } from '@/components/ui/input';
import { NotionBooleanVariable } from '../lib/NotationVariable';
import UserInputDialog from './UserInputDialog';
import { CookiesProvider, useCookies } from 'react-cookie';
import { Field } from '@/components/ui/field';
import { Label } from '@/components/ui/label';
import { Flag, FlagIcon, Plus, X } from 'lucide-react';
import { reportNote } from '../lib/actions';
import { toast } from '@/components/ui/toast';
import { useRouter } from 'next/navigation';

const textareaClass =
    'w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm ' +
    'transition-colors outline-none placeholder:text-muted-foreground resize-none leading-relaxed ' +
    'focus-visible:outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50';

export type Position = 'HPX' | 'Core'

export default function NotationForm() {
    const [cookies, setCookie, removeCookie] = useCookies(['position', 'eid']);
    const [serviceType, setServiceType] = useState<ServiceTypeValue | ''>('');
    const [callReason, setCallReason] = useState<ServiceTypeValue | CallReasonValue | 'custom' | ''>('');
    const [callDetails, setCallDetails] = useState('');
    const [verification, setVerification] = useState<VerificationMethod | ''>('');
    const [selectedActions, setSelectedActions] = useState<string[]>([]);
    const [customReason, setCustomReason] = useState('');
    const [customActionChecked, setCustomActionChecked] = useState(false);
    const [customActions, setCustomActions] = useState<string[]>(['']);
    const [refNumber, setRefNumber] = useState('');
    const [actionVariables, setActionVariables] = useState<Record<string, Variables>>({})
    const [copied, setCopied] = useState(false);
    const [reported, setReported] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [notationType, setNotationType] = useState<'standard' | 'escalated'>('standard');
    const [incidentDescription, setIncidentDescription] = useState('');
    const [escalationTrigger, setEscalationTrigger] = useState<EscalationTrigger | ''>('');
    const [desiredResolution, setDesiredResolution] = useState('');
    const [expectationsSet, setExpectationsSet] = useState('');

    const notationRef = useRef<HTMLDivElement>(null);

    const availableReasons = serviceType ? CALL_REASONS[serviceType] : [];
    // ACTION_OPTIONS is looked up by the specific call reason first (most specific), falling back
    // to the broader service type when that reason has no actions of its own defined.
    const availableActions = callReason && callReason !== 'custom'
        ? ACTION_OPTIONS[callReason] ?? (serviceType ? ACTION_OPTIONS[serviceType] : undefined) ?? []
        : [];
    const selectedReasonLabel = availableReasons.find(r => r.value === callReason)?.label ?? '';
    const selectedServiceLabel = SERVICE_TYPES.find(s => s.value === serviceType)?.label ?? '';

    const position = cookies.position;
    const eid = cookies.eid;

    const step2Visible = !!serviceType;
    const step3Visible = !!callReason;
    const isDigitalIssue = serviceType === 'digital-issues';
    // Digital Issues skips straight from reason to actions (no goal required) unless a goal was
    // already typed, so step 4 needs either "reason chosen and not digital-issues" or "goal filled in".
    const step4Visible = !!callReason && !isDigitalIssue || !!callDetails;

    const handleServiceChange = (value: string | null) => {
        setServiceType(value as ServiceTypeValue);
        setCallReason('');
        setSelectedActions([]);
        setVerification('');
        setCustomReason('');
        setCustomActionChecked(false);
        setCustomActions(['']);
    };

    const handleReasonChange = (value: ServiceTypeValue | CallReasonValue | 'custom' | null) => {
        setCallReason(value ?? "");
        setSelectedActions([]);
        if (value !== 'custom') setCustomReason('');
    };

    const toggleAction = (value: string, variables?: Variables) => {
        const isSelected = selectedActions.includes(value);
        setSelectedActions(prev =>
            isSelected ? prev.filter(a => a !== value) : [...prev, value]
        );
        setActionVariables(prev => {
            if (isSelected) {
                const { [value]: _, ...rest } = prev;
                return rest;
            }
            if (variables) {
                // Clone each instance so the static ACTION_OPTIONS data is never mutated
                const cloned = Object.fromEntries(
                    Object.entries(variables).map(([k, v]) => [k, v.clone()])
                );
                return { ...prev, [value]: cloned };
            }
            return prev;
        });
    };

    const updateCustomAction = (index: number, value: string) => {
        setCustomActions(prev => prev.map((a, i) => (i === index ? value : a)));
    };

    const addCustomActionLine = () => {
        setCustomActions(prev => [...prev, '']);
    };

    const removeCustomActionLine = (index: number) => {
        setCustomActions(prev => prev.length === 1 ? [''] : prev.filter((_, i) => i !== index));
    };

    const handleReset = () => {
        setServiceType('');
        setCallReason('');
        setCallDetails('');
        setVerification('');
        setSelectedActions([]);
        setCustomReason('');
        setCustomActionChecked(false);
        setCustomActions(['']);
        setRefNumber('');
        setActionVariables({});
        setCopied(false);
        setReported(false);
        setNotationType('standard');
        setIncidentDescription('');
        setEscalationTrigger('');
        setDesiredResolution('');
        setExpectationsSet('');
    };

    // Builds the comma-separated "actions taken" portion of the notation from every checked
    // action, swapping in an action's `variableLabel` template (with %placeholder% substitution)
    // once all of its variables have a value, otherwise falling back to the action's plain label.
    const actionsText = useMemo(() => {
        const labels = selectedActions.map(a => {
            const action = availableActions.find(opt => opt.value === a);
            if (!action) return a;
            let label = action.label;
            const vars = actionVariables[a];
            if (action.variableLabel && vars && Object.values(vars).every(v => (v.getValue() ?? '') !== '')) {
                label = action.variableLabel.replace(/%(\w+)%/g, (_, key) => vars[key]?.getValue() ?? '');
            }
            return label;
        });
        if (customActionChecked) {
            for (const action of customActions) {
                if (action.trim()) labels.push(action.trim());
            }
        }
        return labels.join(', ');
    }, [selectedActions, availableActions, customActionChecked, customActions, actionVariables]);

    // Assembles the final copy-pasteable notation text. Escalated calls use a fixed 4-part format;
    // standard calls number their lines dynamically since the "goal" line is optional (step 3 is
    // skippable for Digital Issues), and the CIV method/ref number get prefixed onto the actions line.
    const notation = useMemo(() => {
        if (notationType === 'escalated') {
            if (!incidentDescription.trim() || !escalationTrigger || !desiredResolution.trim() || !expectationsSet.trim()) return '';
            const triggerLabel = ESCALATION_TRIGGERS.find(t => t.value === escalationTrigger)?.label ?? escalationTrigger;
            return [
                'HPX Notes',
                `1. Description of the incident: ${incidentDescription.trim()}`,
                `2. Why did it meet the selected trigger: ${triggerLabel}`,
                `3. Desired resolution the customer looking for: ${desiredResolution.trim()}`,
                `4. What expectations were set with the customer: ${expectationsSet.trim()}`,
            ].join('\n');
        }
        const allStepsVisible = step2Visible && step3Visible && step4Visible;
        if (!serviceType || !callReason || !allStepsVisible) return '';
        const reasonText =
            callReason === 'custom' ? customReason.trim() : selectedReasonLabel;
        if (!reasonText) return '';
        if (!actionsText) return '';
        const details = callDetails.trim();
        const lines: string[] = [];
        if (position) lines.push(position === 'HPX' ? 'HPX Notes' : 'Core Notes');
        lines.push(`1. ${selectedServiceLabel}`);
        lines.push(`2. CCI about ${reasonText}`);
        if (details) lines.push(`3. ${details}`);
        const actionLine = verification ? `[${verification}${verification === 'GOV' && !!refNumber.trim() ? ` ${refNumber}` : ''}] ${actionsText}` : actionsText;
        lines.push(`${details ? '4' : '3'}. ${actionLine}`);
        return lines.join('\n');
    }, [notationType, serviceType, callReason, customReason, refNumber, selectedServiceLabel, selectedReasonLabel, callDetails, verification, actionsText, position, incidentDescription, escalationTrigger, desiredResolution, expectationsSet]);

    useEffect(() => { setMounted(true); }, []);

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

    const submitReport = async () => {
        const actionsFilled = !customActionChecked || customActions.some(a => !!a.trim());
        const reasonFilled = callReason !== 'custom' || !!customReason
        const missingInformation = !notation || !actionsFilled || !reasonFilled
        const notSignedIn = !eid
        if (notSignedIn) return toast.add({
            type: "error",
            description: "You're missing your employee information to be able to report.",
            actionProps: {
                children: "Refresh",
                onClick() {
                    window.location.reload();
                },
            },
        });
        if (missingInformation) return toast.add({
            type: "error",
            description: "Please complete the notation before reporting.",
        });
        if (reported) return toast.add({
            type: "error",
            description: "You already reported this note.",
        });
        const reasonText =
            callReason === 'custom' ? customReason.trim() : selectedReasonLabel;
        await reportNote(serviceType, { eid: cookies.eid, action: actionsText, reason: reasonText, fullNote: notation })
        setReported(true);
        toast.add({
            type: 'success',
            description: 'Toast has been successfully reported!'
        })
    };

    const getVariable = (action: string, variable: string) => {
        return actionVariables[action]?.[variable];
    };

    const setVariable = (action: string, variable: string, value: string) => {
        setActionVariables(prev => {
            if (!prev[action]?.[variable]) return prev;
            const cloned = prev[action][variable].clone();
            cloned.setValue(value);
            return {
                ...prev,
                [action]: { ...prev[action], [variable]: cloned },
            };
        });
    };

    const availablePositionedActions = availableActions.filter(action => !action.position || action.position === position)

    return (
        <div className="min-h-screen bg-gray-50">
            <UserInputDialog />
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
                        · Notation Builder
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <Link
                        href="/admin"
                        className="text-xs cursor-pointer font-semibold text-red-100 border border-red-300 px-3 py-1.5 rounded-lg hover:bg-red-700 transition-colors"
                    >
                        Admin Panel
                    </Link>
                    <button
                        onClick={handleReset}
                        className="text-xs cursor-pointer font-semibold text-red-100 border border-red-300 px-3 py-1.5 rounded-lg hover:bg-red-700 transition-colors"
                    >
                        New Call
                    </button>
                </div>
            </header>

            {/* ── Role selector / Notation type ── */}
            <div className="bg-white border-b border-gray-200 px-6 py-2.5 flex items-center gap-3">
                {mounted && position === 'HPX' && (
                    <>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 shrink-0">Type</span>
                        <div className="flex gap-2">
                            {(['standard', 'escalated'] as const).map(t => (
                                <button key={t} type="button"
                                    onClick={() => setNotationType(t)}
                                    className={`px-3 py-1 rounded-full text-xs font-bold border-2 transition-all ${
                                        notationType === t
                                            ? 'bg-[#CC0000] border-[#CC0000] text-white shadow-sm'
                                            : 'bg-white border-gray-200 text-gray-500 hover:border-[#CC0000] hover:text-[#CC0000]'
                                    }`}
                                >
                                    {t === 'standard' ? 'Standard' : 'Escalated'}
                                </button>
                            ))}
                        </div>
                    </>
                )}
                {mounted && position && (
                    <span className="text-xs text-gray-400 ml-auto">
                        Noting as <span className="font-semibold text-gray-600">{position === 'HPX' ? 'HPX' : 'Core'}</span>
                    </span>
                )}
            </div>

            <main className="max-w-2xl mx-auto py-8 px-4 space-y-4">
                {/* ── Notation Form Card ── */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-6 pt-5 pb-4 border-b border-gray-100">
                        <h1 className="text-sm font-semibold text-gray-700">Customer Notation</h1>
                        <p className="text-xs text-gray-400 mt-0.5">
                            {notationType === 'escalated'
                                ? 'Document the details of the escalated interaction.'
                                : 'Each section shapes the one below — fill top to bottom.'}
                        </p>
                    </div>

                    {notationType === 'escalated' ? (
                        /* ── Escalated form ── */
                        <div className="px-6 py-5 space-y-6">
                            <Section step={1} label="Description of Incident">
                                <textarea
                                    value={incidentDescription}
                                    onChange={e => setIncidentDescription(e.target.value)}
                                    placeholder="Describe the customer's situation..."
                                    rows={3}
                                    className={textareaClass}
                                />
                            </Section>
                            <Divider />
                            <Section step={2} label="Escalation Trigger">
                                <Select value={escalationTrigger || null} onValueChange={v => setEscalationTrigger(v as EscalationTrigger)}>
                                    <SelectTrigger className="w-full h-9 text-sm">
                                        <SelectValue placeholder="Select trigger...">
                                            {() => ESCALATION_TRIGGERS.find(t => t.value === escalationTrigger)?.label || null}
                                        </SelectValue>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {ESCALATION_TRIGGERS.map(t => (
                                            <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </Section>
                            <Divider />
                            <Section step={3} label="Desired Resolution">
                                <textarea
                                    value={desiredResolution}
                                    onChange={e => setDesiredResolution(e.target.value)}
                                    placeholder="What resolution was the customer looking for..."
                                    rows={3}
                                    className={textareaClass}
                                />
                            </Section>
                            <Divider />
                            <Section step={4} label="Expectations Set">
                                <textarea
                                    value={expectationsSet}
                                    onChange={e => setExpectationsSet(e.target.value)}
                                    placeholder="What expectations were communicated to the customer..."
                                    rows={3}
                                    className={textareaClass}
                                />
                            </Section>
                        </div>
                    ) : (
                        /* ── Standard form ── */
                        <div className="px-6 py-5 space-y-6">
                            {/* ── Step 1: Service Type ── */}
                            <Section step={1} label="Type of Servicing">
                                <Select value={serviceType || null} onValueChange={handleServiceChange}>
                                    <SelectTrigger className="w-full h-9 text-sm">
                                        <SelectValue placeholder="Select service type...">
                                            {() => selectedServiceLabel || null}
                                        </SelectValue>
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
                                                Customer called in about
                                            </span>
                                            <Combobox
                                                value={callReason || null}
                                                onValueChange={(value) => handleReasonChange(value as ServiceTypeValue | CallReasonValue | 'custom')}
                                                options={[
                                                    ...availableReasons,
                                                    { value: 'custom', label: 'Custom...' },
                                                ]}
                                                placeholder="select a reason..."
                                                searchPlaceholder="Search reasons..."
                                                className="w-auto min-w-48 flex-1"
                                            />
                                        </div>
                                        {callReason === 'custom' && (
                                            <Input
                                                value={customReason}
                                                onChange={e => setCustomReason(e.target.value)}
                                                placeholder="Type the custom reason..."
                                                className="mt-1 h-9 text-sm"
                                                autoFocus
                                            />
                                        )}
                                    </Section>
                                </>
                            )}

                            {/* ── Step 3: Call Details ── */}
                            {step3Visible && (
                                <Section step={3} label="Call Details">
                                    <textarea
                                        value={callDetails}
                                        onChange={e => setCallDetails(e.target.value)}
                                        placeholder="Provide additional details of the issue the customer is facing..."
                                        rows={3}
                                        className={textareaClass}
                                    />
                                    {!isDigitalIssue && <p className="text-xs text-muted-foreground mt-1">
                                        Optional — leave blank to omit from notation.
                                    </p>}
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
                                            {verification && verification === 'GOV' && <Input
                                                value={refNumber}
                                                onChange={e => setRefNumber(e.target.value)}
                                                placeholder="GOV ID Ref #.."
                                                className="mb-4 h-9 text-sm"
                                                autoFocus
                                            />}
                                            {availablePositionedActions.length > 0 && (
                                                <div className="space-y-2.5">
                                                    {availablePositionedActions.map(action => (
                                                        <div key={action.value} className='space-y-2'>
                                                            <CheckboxItem
                                                                checked={selectedActions.includes(action.value)}
                                                                onToggle={() => toggleAction(action.value, action.variables)}
                                                                label={action.label}
                                                            />
                                                            {selectedActions.includes(action.value) && action.variables &&
                                                                Object.entries(action.variables).map(([k, variable], i) => {
                                                                    const inputVariable = getVariable(action.value, k)
                                                                    return (<div key={i} className="flex items-center gap-2 flex-wrap">
                                                                        <span className="text-sm text-gray-600 font-medium shrink-0">
                                                                            {variable.getLabel()}
                                                                        </span>
                                                                        {inputVariable instanceof NotionBooleanVariable ?
                                                                            <CheckboxItem
                                                                                checked={inputVariable.isOn()}
                                                                                onToggle={() => setVariable(action.value, k, inputVariable.isOn() ? inputVariable.getOffValue() : inputVariable.getOnValue())}
                                                                                label="Yes"
                                                                            />
                                                                            :
                                                                            <Input
                                                                                value={inputVariable?.getValue() ?? ''}
                                                                                onChange={e => setVariable(action.value, k, e.target.value)}
                                                                                placeholder="Input"
                                                                                className="h-9 text-sm w-auto min-w-48 flex-1"
                                                                            />}
                                                                    </div>)
                                                                })
                                                            }
                                                        </div>
                                                    ))}
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
                                                    <div className="space-y-2">
                                                        {customActions.map((action, i) => (
                                                            <div key={i} className="flex items-center gap-2">
                                                                <Input
                                                                    value={action}
                                                                    onChange={e => updateCustomAction(i, e.target.value)}
                                                                    placeholder="Type custom action..."
                                                                    className="h-9 text-sm"
                                                                    autoFocus={i === 0}
                                                                />
                                                                {customActions.length > 1 && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => removeCustomActionLine(i)}
                                                                        className="shrink-0 cursor-pointer text-gray-400 hover:text-[#CC0000] transition-colors"
                                                                        aria-label="Remove custom action"
                                                                    >
                                                                        <X className="w-4 h-4" />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        ))}
                                                        <button
                                                            type="button"
                                                            onClick={addCustomActionLine}
                                                            className="flex cursor-pointer items-center gap-1 text-xs font-semibold text-gray-500 hover:text-[#CC0000] transition-colors"
                                                        >
                                                            <Plus className="w-3.5 h-3.5" />
                                                            Add another action
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        {(customActionChecked || !!customReason) &&
                                            <div className='flex gap-2 mt-5'>
                                                <Label htmlFor='report'>Need to report this submission?</Label>
                                                <button
                                                    onClick={submitReport}
                                                    id='report'
                                                    className={`flex cursor-pointer items-center text-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold tracking-wide transition-all ${reported
                                                        ? 'bg-green-500 text-white'
                                                        : 'bg-[#CC0000] text-white hover:bg-[#AA0000] active:scale-95'
                                                        }`}
                                                >
                                                    {reported ? (
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
                                                            Reported!
                                                        </>
                                                    ) : (
                                                        <>
                                                            <FlagIcon className='w-3 h-3' />
                                                            Report
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        }
                                    </Section>
                                </>
                            )}
                        </div>
                    )}
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
