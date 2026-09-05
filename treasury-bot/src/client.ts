import { createPublicClient, http } from "viem";
import { activeChain } from "./chain.js";

/**
 * createPublicClient only — there is no createWalletClient anywhere in this
 * project, no private key is ever read from env, and no signing library is
 * imported. That's deliberate: treasury-bot/CLAUDE.md says no signing
 * authority, ever. Enforced structurally, not just by convention.
 */
export const publicClient = createPublicClient({
  chain: activeChain,
  transport: http(),
});
