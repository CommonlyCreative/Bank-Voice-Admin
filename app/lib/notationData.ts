import { Position } from "../components/NotationForm";
import { NotionBooleanVariable, NotionVariable } from "./NotationVariable";

/**
 * Step 1 options: the top-level category of what the customer called about.
 * `value` is the stable key used to look up CALL_REASONS/ACTION_OPTIONS; `label` is shown in the UI.
 */
export const SERVICE_TYPES = [
    { value: 'bank-account', label: 'Bank Account Servicing' },
    { value: 'online-banking', label: 'Online Banking Servicing' },
    { value: 'digital-issues', label: 'Digital Issues' },
    { value: 'wire', label: 'Wire Servicing' },
    { value: 'debit-card', label: 'Debit Card Servicing' },
    { value: 'personal-info', label: 'Personal Information Servicing' },
] as const;

/** Union of every valid SERVICE_TYPES value, e.g. 'bank-account' | 'wire' | ... */
export type ServiceTypeValue = (typeof SERVICE_TYPES)[number]['value'];

/**
 * Step 2 options: for each service type, the specific reasons a customer might be calling about.
 * Keyed by ServiceTypeValue so every service type must have its own reason list (enforced below via `satisfies`).
 * Reason `value`s are prefixed per service (ba-, ob-, di-, w-, pi-, or unprefixed for debit-card) to keep them
 * globally unique, since ACTION_OPTIONS below is keyed by these values across all services.
 */
export const CALL_REASONS = {
    'bank-account': [
        { value: 'ba-bank-inquiry', label: 'bank information' },
        { value: 'ba-overdraft-inquiry', label: 'overdraft inquiry' },
        { value: 'ba-ach-transfer', label: 'an ACH transfer' },
        { value: 'ba-transactions', label: 'bank transactions' },
        { value: 'ba-balance-inquiry', label: 'balance inquiry' },
        { value: 'ba-trust-inquiry', label: 'trust inquiry/instructions' },
        { value: 'ba-zelle-inquiry', label: 'Zelle inquiry' },
        { value: 'ba-beneficiaries', label: 'managing beneficiaries' },
        { value: 'ba-account-opening', label: 'opening account(s)' },
        { value: 'ba-account-closure', label: 'closing account(s)' },
        { value: 'ba-cashiers-check', label: 'cashier\'s check' },
        { value: 'ba-bonus-inquiry', label: 'bonus inquiry' },
        { value: 'ba-deposit-hold', label: 'deposit hold' },
        { value: 'ba-documents', label: 'bank documents' },
        { value: 'ba-bill-pay', label: 'bill pay' },
    ],
    'online-banking': [
        { value: 'ob-sso', label: 'trouble signing in' },
        { value: 'ob-online-access', label: 'setting up online access' },
        { value: 'ob-consolidate-usernames', label: 'consolidating usernames' },
    ],
    'digital-issues': [
        { value: 'di-account-closing', label: 'account closing' },
        { value: 'di-account-opening', label: 'account opening' },
        { value: 'di-add-cash-in-store', label: 'add cash in store' },
        { value: 'di-add-joint-holder', label: 'add joint holder' },
        { value: 'di-bene', label: 'beneficiaries' },
        { value: 'di-bill-pay', label: 'Bill Pay' },
        { value: 'di-cashiers-check', label: 'cashier\'s check' },
    ],
    'debit-card': [
        { value: 'debit-declines', label: 'debit card declines' },
        { value: 'debit-replacement', label: 'debit card replacement' },
        { value: 'debit-activation', label: 'debit card activation' },
        { value: 'debit-transactions', label: 'debit card transactions' },
        { value: 'debit-acceptance', label: 'debit card acceptance' },
        { value: 'debit-limits', label: 'debit card limits' },
        { value: 'debit-digital', label: 'digital debit card' },
    ],
    wire: [
        { value: 'w-inbound-wire', label: 'inbound wire process' },
        { value: 'w-general-wire', label: 'general wire inquiries' },
        { value: 'w-outbound-wire', label: 'outbound wire process' },
        { value: 'w-outbound-wire-status', label: 'outbound wire status' },
        { value: 'w-cancel-outbound-wire', label: 'cancelling wire' },
    ],
    'personal-info': [
        { value: 'pi-update-personal', label: 'updating personal information' },
        { value: 'pi-kyc-restriction', label: 'KYC restriction' },
    ],
    // `satisfies` (rather than a type annotation) keeps each reason's literal `value` type intact,
    // which is what lets CallReasonValue below resolve to a real string-literal union instead of `string`.
} as const satisfies Record<ServiceTypeValue, { value: string; label: string }[]>;

/** Union of every reason `value` across every service in CALL_REASONS. */
export type CallReasonValue = (typeof CALL_REASONS)[ServiceTypeValue][number]['value'];

/**
 * Step 4 options: the actions a rep can select as having been performed, looked up first by the
 * chosen call reason and falling back to the chosen service type (see NotationForm's `availableActions`).
 * Not every ServiceTypeValue/CallReasonValue needs an entry — services/reasons with no listed actions
 * simply fall through to the "Custom" action input.
 *
 * `variableLabel`/`variables` let an action prompt for extra details (e.g. account last-4, EID) that get
 * substituted into the final notation text via %placeholder% tokens.
 * `position` restricts an action to a specific rep type ('HPX' | 'Core'); omit it to allow both.
 */
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
    {
        value: 'invalid-np', label: 'INVALID_NP', position: 'HPX', variableLabel: 'INVALID_NP %eid%', variables: {
            eid: new NotionVariable('string', 'Transferring Associate\'s EID'),
        }
    },
    ],
    "ob-sso": [
        { value: 'temp-password', label: 'sent temporary password' },
        { value: 'gave-information', label: 'helped customer to sign in via self service' },
    ],
    "ob-online-access": [
        { value: 'gave-information', label: 'helped set up online access via self service' },
    ],
    "ba-bonus-inquiry": [
        { value: 'payout-expectations', label: 'informed customer of bonus payout timeframes' },
        { value: 'exception', label: 'contacted guru to place exception' },
    ],
    "ba-account-opening": [
        { value: 'gave-information', label: 'informed customer how to open account via self service' },
    ],
    "ba-zelle-inquiry": [
        { value: 'dispute', label: 'transferred to claims to dispute zelle' },
        { value: 'blocked-payment', label: 'informed customer of blocked payment and provided work arounds' },
        { value: 'awp', label: 'informed customer of zelle AWP timeframes' },
        { value: 'set-up-zelle', label: 'helped customer register zelle' },
    ],
    "ba-documents": [
        {
            value: 'dupe-case', label: 'submitted copy request case for documents', variableLabel: 'submitted copy request case for documents [%case%]',
            variables: {
                case: new NotionVariable('number', 'Case #'),
            }
        },
        { value: 'self-service', label: 'helped customer view statements via self service' },
    ],
    "ba-bank-inquiry": [
        { value: 'gave-information', label: 'provided bank information' },
    ],
    "ba-bill-pay": [
        { value: 'dispute', label: 'transferred to claims to investigate bill pay payment' },
        { value: 'informed-status', label: 'informed customer of bill pay payment status' },
    ],
    'ba-trust-inquiry': [
        { value: 'trust-setup', label: 'informed customer how to setup trust' },
        { value: 'sent-upload-link', label: 'sent trust upload link' },
        { value: 'resent-invitation-link', label: 'resent joint holder invitation link' }
    ],
    'ba-account-closure': [
        { value: 'closed-accounts', label: 'closed account(s) for customer' },
        { value: 'closure-case', label: 'submitted case for account closure' },
    ],
    'ba-cashiers-check': [
        { value: 'self-service', label: 'helped with self-service' },
        { value: 'cancel-case', label: 'submitted case to cancel cashiers check' }
    ],
    'ba-deposit-hold': [
        { value: 'released-hold', position: 'HPX', label: 'released check hold as ONE TIME EXCEPTION' },
        { value: 'gave-information', label: 'informed customer of hold timeframes' },
    ],
    'debit-replacement': [
        { value: 'replaced-card', label: 'replaced lost/stolen card' },
        { value: 'reissued-card', label: 'reissued new card' },
        { value: 'closed-card', label: 'closed card' },
    ],
    'debit-acceptance': [
        { value: 'atms', label: 'informed customer of atms available in their region' },
        { value: 'acceptance', label: 'informed customer of Discover Network coversion and acceptance' },
    ],
    'debit-activation': [{ value: 'activated-card', label: 'activated card' }],
    'debit-transactions': [{ value: 'submitted-claim', label: 'submitted claim' }],
    'debit-limits': [{ value: 'increased-limit', label: 'increased limit' }],
    'pi-update-personal': [
        { value: 'updated-phone', label: 'updated phone number' },
        { value: 'updated-email', label: 'updated email' },
        { value: 'updated-employment', label: 'updated employment' },
        { value: 'sent-name-change-link', label: 'sent upload link for name change' },
    ],
    'pi-kyc-restriction': [{ value: 'sent-kyc-form', label: 'sent KYC form' }],
    'w-cancel-outbound-wire': [{ value: 'sent-email', label: 'sent cancellation email and informed them' }],
    'w-outbound-wire': [
        { value: 'self-service', position: 'HPX', label: 'gave information on how to send a wire through self service' },
        { value: 'xfr-hpx', position: 'Core', label: 'transfer to Wire Triage' },
        { value: 'ineligible', label: 'informed customer of account/customer requirements' },
        { value: 'workarounds', label: 'provided other options for payment' },
    ],
    'w-outbound-wire-status': [
        { value: 'xfr-hpx', position: 'Core', label: 'transfer to Wire Triage' },
        { value: 'timeframes', position: 'HPX', label: 'informed customer of wire timeframes' },
        { value: 'fed-ref', position: 'HPX', label: 'provided federal reference number' },
    ],
};

/** Map of placeholder-name -> variable instance attached to an ACTION_OPTIONS entry (see `variableLabel`). */
export type Variables = Record<string, NotionVariable>;

/** Customer Identity Verification (CIV) methods a rep can flag as used before taking action. */
export const VERIFICATION_METHODS = ['ANI', 'MAV', 'OTP', 'GOV'] as const;
export type VerificationMethod = (typeof VERIFICATION_METHODS)[number];

/** Reasons a "standard" notation escalates into the separate escalated-notation flow. */
export const ESCALATION_TRIGGERS = [
    { value: 'requested-manager', label: 'Requested Manager' },
    { value: 'multiple-request', label: 'Multiple Request' },
    { value: 'threaten-legal', label: 'Threaten Legal' },
    { value: 'violation-of-regulation', label: 'Violation of Regulation' },
    { value: 'sales-manipulation', label: 'Sales Manipulation' },
] as const;

export type EscalationTrigger = (typeof ESCALATION_TRIGGERS)[number]['value'];
