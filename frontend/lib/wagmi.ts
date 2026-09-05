import { http, createConfig } from "wagmi";
import { injected } from "wagmi/connectors";
import { activeChain } from "./chains";

/**
 * Connectors deliberately limited to ones that need zero signup and zero
 * recurring cost: browser-injected wallets (MetaMask, Rabby, Brave, etc.).
 *
 * Coinbase Wallet's connector is left out for now: as of this build, its
 * dependency chain (wagmi/connectors -> @base-org/account ->
 * @coinbase/cdp-sdk) pulls in `@x402/*` packages that aren't resolvable and
 * break `next build`. Re-add `coinbaseWallet()` from "wagmi/connectors" once
 * that's fixed upstream, or pin a version where it isn't broken.
 *
 * WalletConnect (for mobile/QR wallets) is available in wagmi/connectors but
 * left out too since it requires a free WalletConnect Cloud account — see
 * .env.example. Add `walletConnect({ projectId: ... })` if/when the human
 * confirms that's in scope.
 */
export const wagmiConfig = createConfig({
  chains: [activeChain],
  connectors: [injected()],
  transports: {
    [activeChain.id]: http(),
  },
  ssr: true,
});

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig;
  }
}
