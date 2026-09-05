import type { LedgerEntry } from "./transfers.js";

export interface Discrepancy {
  asset: string;
  expected: string;
  actual: string;
  diff: string;
  note: string;
}

/**
 * Applies a batch of ledger entries to a previous running balance and
 * returns the new expected balance. Does NOT touch the live on-chain read
 * — that comparison happens in reconcileAsset below, deliberately kept
 * separate so "what we computed" and "what's actually on chain" are two
 * distinct numbers that get compared, not merged.
 */
export function applyEntries(
  previousBalance: bigint,
  entries: LedgerEntry[]
): bigint {
  let balance = previousBalance;
  for (const entry of entries) {
    const amount = BigInt(entry.amount);
    balance = entry.direction === "in" ? balance + amount : balance - amount;
  }
  return balance;
}

/**
 * Compares computed-expected vs. actual on-chain balance for one asset.
 * isFirstRun assets get no diff check — there's no prior running balance to
 * compare against, so the first observation just becomes the baseline.
 * Returns a Discrepancy if they don't match, or null if they do (or if this
 * is the first run for this asset).
 */
export function reconcileAsset(
  assetLabel: string,
  expectedBalance: bigint,
  actualBalance: bigint,
  isFirstRun: boolean,
  hasUntracedOutgoingRisk: boolean
): Discrepancy | null {
  if (isFirstRun) return null;
  if (expectedBalance === actualBalance) return null;

  const diff = actualBalance - expectedBalance;
  return {
    asset: assetLabel,
    expected: expectedBalance.toString(),
    actual: actualBalance.toString(),
    diff: diff.toString(),
    note: hasUntracedOutgoingRisk
      ? "Native currency: outgoing internal-call transfers aren't traceable via public RPC logs (see transfers.ts). This diff may simply be an untraced outgoing Safe transaction, not an error — shown for transparency, not hidden."
      : "Computed balance from tracked transfers doesn't match the live on-chain balance. Could mean a missed log (RPC pagination limit, e.g.) or an asset movement this script doesn't track yet.",
  };
}
