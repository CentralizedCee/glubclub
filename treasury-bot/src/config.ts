import "dotenv/config";
import type { Address } from "viem";

/**
 * TODO(contracts): nothing deployed yet as of 2026-09-05 (see docs/STATUS.md).
 * These read as empty strings until contracts fills in .env — mirrors the
 * "zero address until configured" pattern frontend/lib/contracts.ts uses,
 * rather than crashing on startup. Downstream code should skip a check
 * cleanly (and say so in the output) when an address isn't configured yet,
 * not treat it as an error.
 */
function optionalAddress(name: string): Address | null {
  const value = process.env[name];
  if (!value) return null;
  return value as Address;
}

export const SAFE_ADDRESS = optionalAddress("SAFE_ADDRESS");
export const TOKEN_CONTRACT_ADDRESS = optionalAddress("TOKEN_CONTRACT_ADDRESS");
export const NFT_CONTRACT_ADDRESS = optionalAddress("NFT_CONTRACT_ADDRESS");

export const TRACKED_TOKEN_ADDRESSES: Address[] = (
  process.env.TRACKED_TOKEN_ADDRESSES || ""
)
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean) as Address[];

export const RPC_URL =
  process.env.RPC_URL || "https://sepolia-rollup.arbitrum.io/rpc";

export const CHAIN_ID = Number(process.env.CHAIN_ID || 421614);

export const INITIAL_LOOKBACK_BLOCKS = BigInt(
  process.env.INITIAL_LOOKBACK_BLOCKS || "5000"
);

export const safeConfigured = SAFE_ADDRESS !== null;
