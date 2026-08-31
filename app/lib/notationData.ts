import { Position } from "../components/NotationForm";
import { NotionBooleanVariable, NotionVariable } from "./NotationVariable";

export const SERVICE_TYPES = [
    { value: 'bank-account', label: 'Bank Account Servicing' },
    { value: 'digital-issues', label: 'Digital Issues' },
    { value: 'wire', label: 'Wire Servicing' },
    { value: 'debit-card', label: 'Debit Card Servicing' },
    { value: 'personal-info', label: 'Personal Information Servicing' },
] as const;

export type ServiceTypeValue = (typeof SERVICE_TYPES)[number]['value'];

export const CALL_REASONS = {
    'bank-account': [
        { value: 'ba-bank-inquiry', label: 'bank information' },
        { value: 'ba-overdraft-inquiry', label: 'overdraft inquiry' },
        { value: 'ba-ach-transfer', label: 'an ACH transfer' },
        { value: 'ba-balance-inquiry', label: 'balance inquiry' },
        { value: 'ba-trust-inquiry', label: 'trust inquiry/instructions' },
        { value: 'ba-zelle-inquiry', label: 'Zelle inquiry' },
        { value: 'ba-account-opening', label: 'opening account(s)' },
        { value: 'ba-account-closure', label: 'closing account(s)' },
        { value: 'ba-cashiers-check', label: 'Cashier\'s Check' },
        { value: 'ba-deposit-hold', label: 'deposit hold' },
        { value: 'ba-check-hold', label: 'check hold' },
        { value: 'ba-direct-deposit', label: 'direct deposit inquiry' },
    ],
    'digital-issues': [
        { value: 'di-account-closing', label: 'account closing' },
        { value: 'di-account-opening', label: 'account opening' },
        { value: 'di-add-cash-in-store', label: 'add cash in store' },
        { value: 'di-add-joint-holder', label: 'add joint holder' },
        { value: 'di-bene', label: 'beneficiaries' },
        { value: 'di-bill-pay', label: 'Bill Pay' },
        { value: 'di-cashiers-check', label: 'Cashier\'s Check' },
    ],
    'debit-card': [
        { value: 'debit-declines', label: 'debit card declines' },
        { value: 'debit-replacement', label: 'debit card replacement' },
        { value: 'debit-transactions', label: 'debit card transactions' },
        { value: 'debit-limits', label: 'debit card limits' },
    ],
    wire: [
        { value: 'w-inbound-wire', label: 'inbound wire instructions' },
        { value: 'w-general-wire', label: 'general wire inquiries' },
        { value: 'w-outbound-wire', label: 'outbound wire instructions' },
        { value: 'w-outbound-wire-status', label: 'outbound wire status' },
    ],
    'personal-info': [
        { value: 'pi-update-personal', label: 'updating personal information' },
        { value: 'pi-kyc-restriction', label: 'KYC restriction' },
    ],
} as const satisfies Record<ServiceTypeValue, { value: string; label: string }[]>;

export type CallReasonValue = (typeof CALL_REASONS)[ServiceTypeValue][number]['value'];

export const ACTION_OPTIONS: Partial<Record<ServiceTypeValue | CallReasonValue, { value: string; label: string, variableLabel?: string, variables?: Variables, position?: Position }[]>> = {
    'ba-ach-transfer': [{
        value: 'transferred-funds', label: 'transferred funds for customer', variableLabel: '%external% transfer of funds from ACCT #%last4From% to ACCT #%last4To%', variables: {
            last4From: new NotionVariable('number', 'Last 4 of Sender Account'),
            last4To: new NotionVariable('number', 'Last 4 of Reciever Account'),
            external: new NotionBooleanVariable('External Transfer?', 'EXT', 'INT')
        }
    }],
    'digital-issues': [{
        value: 'xfr-to-di', label: 'transferred to digital issues', position: 'Core', variableLabel:
            `Troubleshooting Results:
    GURU's EID: %guru%
    Browser/Device customer is using: %browser%
    Using supported browser/device? %supported%
    Accessed site directly (no bookmarks)? %accessedDirectly%
    Confirmed no VPN? %vpn%
    Cleared cache and cookies or used Private/Incognito Browsing? %clearedCache%
    Confirmed not being impacted by a known issue? %knownIssue%
    transfered to Digital Issues for further assistance`, variables: {
            guru: new NotionVariable('string', 'GURU\'s EID'),
            browser: new NotionVariable('string', 'Browser/Device customer is using'),
            supported: new NotionBooleanVariable('Supported Browser or Latest app version?', 'Yes', 'No'),
            accessedDirectly: new NotionBooleanVariable('Accessed the site directly (no bookmark)?', 'Yes', 'No'),
            vpn: new NotionBooleanVariable('Confirmed no VPN?', 'Yes', 'No'),
            clearedCache: new NotionBooleanVariable('Cleared cache and cookies or used incognito/private browsing?', 'Yes', 'No'),
            knownIssue: new NotionBooleanVariable('Confirmed not being impacted by a known issue?', 'Yes', 'No'),
        }
    },
    { value: 'submitted-di-ticket', label: 'submitted digital issue ticket', position: 'HPX', },
    { value: 'invalid-np', label: 'INVALID_NP', position: 'HPX', variableLabel: 'INVALID_NP %eid%', variables: {
            eid: new NotionVariable('string', 'Transferring Associate\'s EID'),
        } },
    ],
    "ba-direct-deposit": [
        { value: 'missing-deposit', label: 'gave information that deposit has not posted' },
    ],
    "ba-bank-inquiry": [
        { value: 'gave-information', label: 'gave information of bank information' },
    ],
    'ba-trust-inquiry': [
        { value: 'trust-setup', label: 'informed how to setup trust' },
        { value: 'sent-upload-link', label: 'sent trust upload link' },
        { value: 'resent-invitation-link', label: 'resent joint holder invitation link' }
    ],
    'ba-account-closure': [
        { value: 'closed-accounts', label: 'closed account(s) for customer' },
        { value: 'closure-case', label: 'submitted case to close accounts' },
    ],
    'ba-cashiers-check': [
        { value: 'self-service', label: 'helped with self-service' },
        { value: 'cancel-case', label: 'submitted case to cancel cashiers check' }
    ],
    'debit-replacement': [
        { value: 'shipped-card', label: 'shipped new card' },
        { value: 'closed-card', label: 'closed card' },
    ],
    'debit-transactions': [{ value: 'submitted-claim', label: 'submitted claim' }],
    'debit-limits': [{ value: 'increased-limit', label: 'increased limit' }],
    'pi-update-personal': [
        { value: 'updated-phone', label: 'updated phone number' },
        { value: 'updated-email', label: 'updated email' },
        { value: 'updated-employment', label: 'updated employment' },
        { value: 'sent-name-change-link', label: 'sent upload link for name change' },
    ],
    'pi-kyc-restriction': [{ value: 'sent-kyc-form', label: 'sent KYC form' }],
};

export type Variables = Record<string, NotionVariable>;
export const VERIFICATION_METHODS = ['ANI', 'MAV', 'OTP', 'GOV'] as const;
export type VerificationMethod = (typeof VERIFICATION_METHODS)[number];

export const ESCALATION_TRIGGERS = [
    { value: 'requested-manager', label: 'Requested Manager' },
    { value: 'multiple-request', label: 'Multiple Request' },
    { value: 'threaten-legal', label: 'Threaten Legal' },
    { value: 'violation-of-regulation', label: 'Violation of Regulation' },
    { value: 'sales-manipulation', label: 'Sales Manipulation' },
] as const;

export type EscalationTrigger = (typeof ESCALATION_TRIGGERS)[number]['value'];
