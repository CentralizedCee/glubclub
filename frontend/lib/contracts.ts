import type { Address } from "viem";

/**
 * TODO(contracts): Nothing has been deployed yet as of 2026-09-05 (see
 * docs/STATUS.md). These addresses are read from env and will be the zero
 * address until contracts fills in .env.local. UI that depends on these
 * should render as disabled/"not live yet," never as if minting or the
 * presale is already open.
 */
export const NFT_CONTRACT_ADDRESS = (process.env
  .NEXT_PUBLIC_NFT_CONTRACT_ADDRESS || "") as Address;

export const TOKEN_CONTRACT_ADDRESS = (process.env
  .NEXT_PUBLIC_TOKEN_CONTRACT_ADDRESS || "") as Address;

export const nftContractConfigured = NFT_CONTRACT_ADDRESS.length > 0;
export const tokenContractConfigured = TOKEN_CONTRACT_ADDRESS.length > 0;

/**
 * Minimal placeholder ABI fragments. Replace with the real generated ABI
 * from the contracts session's build artifacts once available — do not
 * hand-guess function signatures beyond this bare mint/tier-unlock shape,
 * since that's what would silently drift from whatever OpenZeppelin base
 * contracts actually implements.
 *
 * Naming note: the staking/tier function is named to match the project's
 * locked wording rules — it unlocks perks/tiers, it does not "claim" or
 * "earn" anything. See /content/WORDING-RULES.md.
 */
export const nftAbiPlaceholder = [
  {
    type: "function",
    name: "mint",
    stateMutability: "payable",
    inputs: [{ name: "quantity", type: "uint256" }],
    outputs: [],
  },
  {
    type: "function",
    name: "totalSupply",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

export const tokenAbiPlaceholder = [
  {
    type: "function",
    name: "unlockTier",
    stateMutability: "nonpayable",
    inputs: [{ name: "amount", type: "uint256" }],
    outputs: [],
  },
] as const;
