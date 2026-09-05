import type { Address } from "viem";
import { publicClient } from "./client.js";
import { safeAbi } from "./abi.js";

export interface SafeInfo {
  owners: Address[];
  threshold: number;
  nonce: string;
}

/**
 * Direct-RPC reads of the Safe singleton's own state. This replaces the
 * safe-transaction-*.safe.global hosted API, which was confirmed 2026-09-05
 * not to cover Robinhood Chain. These three calls are all a Safe exposes
 * for this and are stable across Safe versions — no ABI risk here.
 */
export async function readSafeInfo(safeAddress: Address): Promise<SafeInfo> {
  const [owners, threshold, nonce] = await Promise.all([
    publicClient.readContract({
      address: safeAddress,
      abi: safeAbi,
      functionName: "getOwners",
    }),
    publicClient.readContract({
      address: safeAddress,
      abi: safeAbi,
      functionName: "getThreshold",
    }),
    publicClient.readContract({
      address: safeAddress,
      abi: safeAbi,
      functionName: "nonce",
    }),
  ]);

  return {
    owners: owners as Address[],
    threshold: Number(threshold),
    nonce: (nonce as bigint).toString(),
  };
}
