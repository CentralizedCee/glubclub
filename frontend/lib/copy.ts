/**
 * All strings here are scaffolding placeholders, not final marketing copy —
 * that's /content's job (see frontend/CLAUDE.md). Every value is wrapped
 * with "[PLACEHOLDER COPY]" so it's obvious in the running app that real
 * text hasn't landed yet. Even so, placeholders avoid the banned wording in
 * /content/WORDING-RULES.md (no "profit," "returns," "invest," "backed by,"
 * etc.) so nothing here sets a bad precedent if it accidentally ships.
 */
export const copy = {
  siteName: "GlubClub",
  testnetBanner:
    "[PLACEHOLDER COPY] Testnet only — no real funds, no mainnet.",
  home: {
    heading: "[PLACEHOLDER COPY] Membership pass + utility token",
    body: "[PLACEHOLDER COPY] Scaffold homepage. Final copy pending from /content.",
  },
  mint: {
    heading: "[PLACEHOLDER COPY] Mint your access pass",
    notConfigured:
      "[PLACEHOLDER COPY] Mint isn't live yet — the pass contract hasn't been deployed to testnet.",
    connectPrompt: "[PLACEHOLDER COPY] Connect a wallet to continue.",
    quantityLabel: "[PLACEHOLDER COPY] Quantity",
    mintButton: "[PLACEHOLDER COPY] Mint",
    pendingButton: "[PLACEHOLDER COPY] Confirming…",
  },
  presale: {
    heading: "[PLACEHOLDER COPY] Token access",
    notConfigured:
      "[PLACEHOLDER COPY] Token access isn't live yet — the token contract hasn't been deployed to testnet.",
    body: "[PLACEHOLDER COPY] The token unlocks utility and governance features, not treasury performance.",
    amountLabel: "[PLACEHOLDER COPY] Amount",
    submitButton: "[PLACEHOLDER COPY] Continue",
  },
  dashboard: {
    heading: "[PLACEHOLDER COPY] Company reserves — public ledger",
    notConfigured:
      "[PLACEHOLDER COPY] The treasury transparency bot hasn't published an endpoint yet.",
    disclaimer:
      "[PLACEHOLDER COPY] This is a read-only view of company reserves, not a holder statement.",
  },
};
