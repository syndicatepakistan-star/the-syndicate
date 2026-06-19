/** Withdrawal rows that no longer reserve balance (excluded from statement total). */
export const WITHDRAWAL_REFUNDED_STATUSES = new Set([
  "rejected",
  "cancelled",
  "denied",
  "refunded",
  "failed",
]);

/** Admin may label a paid-out row with any of these statuses. */
export const WITHDRAWAL_TRANSFERRED_STATUSES = new Set([
  "complete",
  "completed",
  "transferred",
  "paid",
  "wire_sent",
  "sent",
  "payout_sent",
]);

export function isWithdrawalTransferred(
  status: string | null | undefined,
  transferredAt: string | null | undefined
): boolean {
  const st = (status || "").toLowerCase();
  return WITHDRAWAL_TRANSFERRED_STATUSES.has(st) || Boolean(transferredAt?.trim());
}

export function formatWithdrawalTransferredDate(
  status: string | null | undefined,
  transferredAt: string | null | undefined,
  formatDate: (iso: string | null | undefined) => string
): string {
  if (!isWithdrawalTransferred(status, transferredAt)) return "—";
  return formatDate(transferredAt);
}
