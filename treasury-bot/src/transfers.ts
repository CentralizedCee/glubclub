import type { Address } from "viem";
import { publicClient } from "./client.js";
import { erc20Abi } from "./abi.js";

export interface LedgerEntry {
  asset: "native" | Address;
  direction: "in" | "out";
  amount: string; // raw integer, as string
  blockNumber: string;
  txHash: string;
  /** false for anything reconstructed from a balance diff rather than a log */
  traced: boolean;
}

/**
 * ERC-20 Transfer events are emitted by the token contract itself whenever
 * it moves value — including when the call originates from inside the
 * Safe's execTransaction (an internal call, not a top-level tx). So this
 * catches outgoing token transfers correctly even though the Safe has no
 * private key of its own and never appears as a tx sender. This is the
 * accurate half of history tracking.
 */
export async function getTokenTransferEntries(
  safeAddress: Address,
  tokenAddress: Address,
  fromBlock: bigint,
  toBlock: bigint
): Promise<LedgerEntry[]> {
  const [incoming, outgoing] = await Promise.all([
    publicClient.getLogs({
      address: tokenAddress,
      event: erc20Abi[3], // Transfer
      args: { to: safeAddress },
      fromBlock,
      toBlock,
    }),
    publicClient.getLogs({
      address: tokenAddress,
      event: erc20Abi[3],
      args: { from: safeAddress },
      fromBlock,
      toBlock,
    }),
  ]);

  const entries: LedgerEntry[] = [];
  for (const log of incoming) {
    entries.push({
      asset: tokenAddress,
      direction: "in",
      amount: (log.args.value as bigint).toString(),
      blockNumber: log.blockNumber.toString(),
      txHash: log.transactionHash,
      traced: true,
    });
  }
  for (const log of outgoing) {
    entries.push({
      asset: tokenAddress,
      direction: "out",
      amount: (log.args.value as bigint).toString(),
      blockNumber: log.blockNumber.toString(),
      txHash: log.transactionHash,
      traced: true,
    });
  }
  return entries;
}

/**
 * KNOWN LIMITATION, flagged rather than hidden: native currency has no
 * event log for internal-call value transfers, so an outgoing native
 * transfer executed via the Safe's execTransaction (an internal call) is
 * invisible to eth_getLogs and to plain block scanning alike — that needs
 * a trace API (debug_traceBlock, or a paid indexer) that public RPCs
 * generally don't expose. Top-level *incoming* native sends directly to
 * the Safe address ARE visible via block scanning, so this function only
 * covers that half; reconcile.ts flags the rest via balance-diff instead
 * of silently omitting it. Revisit if Robinhood Chain ships an explorer
 * API or the project ever budgets for a trace-capable RPC.
 */
export async function getNativeIncomingEntries(
  safeAddress: Address,
  fromBlock: bigint,
  toBlock: bigint
): Promise<LedgerEntry[]> {
  const entries: LedgerEntry[] = [];
  const lowerSafe = safeAddress.toLowerCase();

  for (let b = fromBlock; b <= toBlock; b++) {
    const block = await publicClient.getBlock({
      blockNumber: b,
      includeTransactions: true,
    });
    for (const tx of block.transactions) {
      if (
        typeof tx !== "string" &&
        tx.to?.toLowerCase() === lowerSafe &&
        tx.value > 0n
      ) {
        entries.push({
          asset: "native",
          direction: "in",
          amount: tx.value.toString(),
          blockNumber: b.toString(),
          txHash: tx.hash,
          traced: true,
        });
      }
    }
  }
  return entries;
}
