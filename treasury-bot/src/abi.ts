/**
 * Unlike frontend/lib/contracts.ts's placeholder ABIs (which stand in for
 * GlubClub's own custom contracts and MUST be replaced with the real
 * generated ABI once deployed), everything below is a well-known, stable
 * standard interface that doesn't change per-deployment:
 *   - Safe{Wallet} singleton reads (getOwners/getThreshold/nonce) — same
 *     across every Safe, any chain, any version this project would use.
 *   - Standard ERC-20 reads — confirmed 2026-09-05 that Stock Tokens on
 *     Robinhood Chain are plain ERC-20s, so this covers them too, not just
 *     the GlubClub utility token.
 *   - Standard ERC-721 balanceOf — for NFT_CONTRACT_ADDRESS, in case the
 *     treasury ever holds reserved/unminted passes. Read-only, minimal.
 * Safe to hardcode. No TODO(contracts) needed for these three.
 */

export const safeAbi = [
  {
    type: "function",
    name: "getOwners",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address[]" }],
  },
  {
    type: "function",
    name: "getThreshold",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "nonce",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "event",
    name: "ExecutionSuccess",
    inputs: [
      { name: "txHash", type: "bytes32", indexed: false },
      { name: "payment", type: "uint256", indexed: false },
    ],
  },
] as const;

export const erc20Abi = [
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "decimals",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
  },
  {
    type: "function",
    name: "symbol",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
  },
  {
    type: "event",
    name: "Transfer",
    inputs: [
      { name: "from", type: "address", indexed: true },
      { name: "to", type: "address", indexed: true },
      { name: "value", type: "uint256", indexed: false },
    ],
  },
] as const;

export const erc721BalanceAbi = [
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "owner", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;
