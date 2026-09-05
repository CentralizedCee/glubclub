import { defineChain } from "viem";

/**
 * Verified 2026-09-05 against docs.robinhood.com/chain/connecting (chain ID
 * table + "Public Endpoints" table). Chain ID 46630 and the public RPC URL
 * both match Robinhood's own docs, independently of the chat message that
 * prompted this change -- that message wasn't reflected in docs/STATUS.md,
 * so it was checked rather than taken on faith.
 *
 * Note from the same docs page: this public RPC is rate-limited and
 * explicitly "not recommended for production use." Robinhood recommends
 * Alchemy as the primary provider
 * (`https://robinhood-testnet.g.alchemy.com/v2/{API_KEY}`), which needs a
 * free account -- flagging per the zero-budget rule rather than assuming
 * it's in scope. Public RPC is fine for testnet dev in the meantime; swap
 * via NEXT_PUBLIC_RPC_URL if rate limits become a problem.
 */
export const robinhoodChainTestnet = defineChain({
  id: 46630,
  name: "Robinhood Chain Testnet",
  nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_RPC_URL || "https://rpc.testnet.chain.robinhood.com"],
    },
  },
  blockExplorers: {
    default: {
      name: "Robinhood Chain Testnet Explorer",
      url: "https://explorer.testnet.chain.robinhood.com",
    },
  },
  testnet: true,
});

export const activeChain = robinhoodChainTestnet;

export const isPlaceholderChain = false;
