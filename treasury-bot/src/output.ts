import { writeFile, mkdir } from "node:fs/promises";
import type { Discrepancy } from "./reconcile.js";
import type { LedgerEntry } from "./transfers.js";
import type { SafeInfo } from "./safeReads.js";

const OUTPUT_PATH = "output/treasury-ledger.json";

export interface Holding {
  asset: "native" | string;
  symbol: string;
  rawAmount: string;
  decimals: number;
}

/**
 * IMPORTANT — this shape is aggregate-only, on purpose. There is no
 * per-holder, per-NFT, or per-wallet allocation field anywhere here, and
 * none should be added: computing "your share of the treasury" is exactly
 * the framing content/WORDING-RULES.md rules out ("your share of," implied
 * entitlement to treasury performance). This bot reports what the company
 * holds, full stop — not what any individual is owed. If a future request
 * asks to add a per-holder breakdown, that's a flag-for-human-review
 * moment, not a schema change to make quietly.
 */
export interface TreasuryLedgerOutput {
  safeAddress: string | null;
  owners: string[];
  threshold: number | null;
  holdings: Holding[];
  recentTransactions: LedgerEntry[];
  discrepancies: Discrepancy[];
  lastReconciled: string; // ISO timestamp
  network: {
    chainId: number;
    isPlaceholderChain: boolean;
  };
  disclaimer: string;
}

export async function writeOutput(
  data: TreasuryLedgerOutput
): Promise<void> {
  await mkdir("output", { recursive: true });
  await writeFile(OUTPUT_PATH, JSON.stringify(data, null, 2));
}

export function buildOutput(params: {
  safeAddress: string | null;
  safeInfo: SafeInfo | null;
  holdings: Holding[];
  recentTransactions: LedgerEntry[];
  discrepancies: Discrepancy[];
  chainId: number;
  isPlaceholderChain: boolean;
}): TreasuryLedgerOutput {
  return {
    safeAddress: params.safeAddress,
    owners: params.safeInfo?.owners ?? [],
    threshold: params.safeInfo?.threshold ?? null,
    holdings: params.holdings,
    recentTransactions: params.recentTransactions,
    discrepancies: params.discrepancies,
    lastReconciled: new Date().toISOString(),
    network: {
      chainId: params.chainId,
      isPlaceholderChain: params.isPlaceholderChain,
    },
    // [PLACEHOLDER COPY] final wording is /content's call, not this
    // session's — see content/WORDING-RULES.md. This placeholder is
    // deliberately checked against the banned-word list already.
    disclaimer:
      "[PLACEHOLDER COPY] This is a read-only view of company reserves on testnet, not a holder statement or a claim on treasury performance.",
  };
}
