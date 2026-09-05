import { defineChain } from "viem";
import { arbitrumSepolia } from "viem/chains";
import { RPC_URL, CHAIN_ID } from "./config.js";

/**
 * TODO(contracts): This is a PLACEHOLDER, same status as
 * frontend/lib/chains.ts's robinhoodChainTestnetPlaceholder. Robinhood
 * Chain's testnet chainId/RPC/explorer have not been verified yet. What
 * *was* confirmed 2026-09-05 (see docs/STATUS.md): Stock Tokens on it are
 * standard ERC-20s, and Safe's hosted Transaction Service does not cover
 * this chain — hence this script reads everything directly over RPC rather
 * than calling safe-transaction-*.safe.global.
 *
 * Once contracts confirms the real chainId/RPC, update CHAIN_ID/RPC_URL in
 * .env and this will pick them up automatically — no code change needed
 * unless the real chain requires custom formatters/serializers.
 */
export const activeChain = defineChain({
  id: CHAIN_ID,
  name:
    CHAIN_ID === arbitrumSepolia.id
      ? "Arbitrum Sepolia (stand-in for Robinhood Chain testnet)"
      : "Robinhood Chain Testnet (placeholder)",
  nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: [RPC_URL] },
  },
  testnet: true,
});

export const isPlaceholderChain = true;
