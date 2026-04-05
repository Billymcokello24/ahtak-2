import type { MembershipPageContent } from './api';

/** Defaults when API is unavailable or fields are missing. */
export const DEFAULT_MEMBERSHIP_FEES = {
  registration_fee_kes: 1000,
  retention_fee_kes_per_year: 1200,
  retention_welfare_allocation_kes: 200,
  student_membership_fee_kes: 500,
  mpesa_paybill: '400222',
  mpesa_account_format: '354008#phone number',
} as const;

function num(v: string | number | undefined | null, fallback: number): number {
  if (v === undefined || v === null || v === '') return fallback;
  const n = typeof v === 'number' ? v : parseFloat(String(v));
  return Number.isFinite(n) ? n : fallback;
}

function formatKshAmount(n: number): string {
  const hasFraction = Math.abs(n % 1) > 1e-9;
  const s = n.toLocaleString('en-KE', {
    minimumFractionDigits: hasFraction ? 2 : 0,
    maximumFractionDigits: 2,
  });
  return `Ksh. ${s}/=`;
}

/** Rows for fee cards (membership page + home summary). */
export function membershipFeeRows(c: MembershipPageContent | null): { label: string; value: string }[] {
  const reg = num(c?.registration_fee_kes, DEFAULT_MEMBERSHIP_FEES.registration_fee_kes);
  const ret = num(c?.retention_fee_kes_per_year, DEFAULT_MEMBERSHIP_FEES.retention_fee_kes_per_year);
  const welfare = num(c?.retention_welfare_allocation_kes, DEFAULT_MEMBERSHIP_FEES.retention_welfare_allocation_kes);
  const student = num(c?.student_membership_fee_kes, DEFAULT_MEMBERSHIP_FEES.student_membership_fee_kes);

  return [
    { label: 'Registration fee (once)', value: formatKshAmount(reg) },
    { label: 'Retention fee (per annum)', value: `${formatKshAmount(ret)} P.A` },
    {
      label: 'Welfare allocation',
      value: `${formatKshAmount(welfare)} from retention goes to welfare`,
    },
    { label: 'Student membership', value: formatKshAmount(student) },
  ];
}

export function membershipPaymentInfo(c: MembershipPageContent | null): { paybill: string; accountFormat: string } {
  const paybill = (c?.mpesa_paybill ?? '').trim() || DEFAULT_MEMBERSHIP_FEES.mpesa_paybill;
  const accountFormat =
    (c?.mpesa_account_format ?? '').trim() || DEFAULT_MEMBERSHIP_FEES.mpesa_account_format;
  return { paybill, accountFormat };
}
