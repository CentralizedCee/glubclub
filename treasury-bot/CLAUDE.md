# Role: Treasury Transparency Bot

Read `../CLAUDE.md` first.

## Scope
- Read-only tracking of the Safe{Wallet} multisig treasury: holdings and
  transaction history.
- Public ledger output. Reuse ONLY the public-ledger / on-chain-
  reconciliation mechanism from the Gumble Bank bot — NOT its per-
  participant share-assignment feature (Gumble Bank assigns each Discord
  member a wallet share they can check; that's a per-holder allocation,
  which is exactly the "your share of" pattern this project's data model
  must not compute, even internally — see Hard limits below). Gumble Bank
  is a pooled trading fund where that feature is the point; GlubClub
  deliberately isn't.
- Expose data in a form `/frontend` can display on the public dashboard.

## Hard limits
- This bot has **no signing authority** and never will. Read-only wallet
  indexing only — it must not be able to move funds under any configuration.
- Do not present the data as "holder returns" or anything implying
  entitlement — see `/content/WORDING-RULES.md`. This is a transparency
  ledger ("here's what the company holds"), not a share statement.
- Data model = aggregate company-level figures only (total holdings, total
  transaction volume, owner/signer info). No field computes or exposes a
  per-NFT or per-token-holder allocation, even internally, even if never
  surfaced in the UI.
