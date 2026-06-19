export const SERVICE_TYPES = [
  { value: 'bank-account', label: 'Bank Account Servicing' },
  { value: 'wire', label: 'Wire Servicing' },
  { value: 'debit-card', label: 'Debit Card Servicing' },
  { value: 'personal-info', label: 'Personal Information Servicing' },
] as const;

export type ServiceTypeValue = (typeof SERVICE_TYPES)[number]['value'];

export const CALL_REASONS: Record<ServiceTypeValue, { value: string; label: string }[]> = {
  'bank-account': [
    { value: 'overdraft-inquiry', label: 'overdraft inquiry' },
    { value: 'ach-transfer', label: 'an ACH transfer' },
    { value: 'balance-inquiry', label: 'balance inquiry' },
    { value: 'trust-inquiry', label: 'trust inquiry/instructions' },
    { value: 'zelle-inquiry', label: 'Zelle inquiry' },
  ],
  'debit-card': [
    { value: 'debit-declines', label: 'debit card declines' },
    { value: 'debit-replacement', label: 'debit card replacement' },
    { value: 'debit-transactions', label: 'debit card transactions' },
    { value: 'debit-limits', label: 'debit card limits' },
  ],
  wire: [
    { value: 'inbound-wire', label: 'inbound wire instructions' },
    { value: 'general-wire', label: 'general wire inquiries' },
    { value: 'outbound-wire', label: 'outbound wire instructions' },
    { value: 'outbound-wire-status', label: 'outbound wire status' },
  ],
  'personal-info': [
    { value: 'update-personal', label: 'updating personal information' },
    { value: 'kyc-restriction', label: 'KYC restriction' },
  ],
};

export const ACTION_OPTIONS: Partial<Record<string, { value: string; label: string }[]>> = {
  'ach-transfer': [{ value: 'transferred-funds', label: 'transferred funds for customer' }],
  'trust-inquiry': [{ value: 'sent-upload-link', label: 'sent upload link' }],
  'debit-replacement': [
    { value: 'shipped-card', label: 'shipped new card' },
    { value: 'closed-card', label: 'closed card' },
  ],
  'debit-transactions': [{ value: 'submitted-claim', label: 'submitted claim' }],
  'debit-limits': [{ value: 'increased-limit', label: 'increased limit' }],
  'update-personal': [
    { value: 'updated-phone', label: 'updated phone number' },
    { value: 'updated-email', label: 'updated email' },
    { value: 'updated-employment', label: 'updated employment' },
    { value: 'sent-name-change-link', label: 'sent upload link for name change' },
  ],
  'kyc-restriction': [{ value: 'sent-kyc-form', label: 'sent KYC form' }],
};

export const VERIFICATION_METHODS = ['ANI', 'OTP', 'GOV', '4TO'] as const;
export type VerificationMethod = (typeof VERIFICATION_METHODS)[number];
