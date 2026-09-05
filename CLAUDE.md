# Project: GlubClub (glubclub.lol) — Membership NFT + Utility Token, Treasury-Backed

Read this file first, every session, before doing any work. If anything here
conflicts with what you'd otherwise do, this file wins. Flag conflicts to the
human rather than resolving them yourself.

## What this project is
An NFT membership pass + a utility/governance token. The company treasury
separately holds tokenized equities (regulated tokenized-stock products) as
ordinary company reserves. This is deliberately **not** positioned as an
investment product — see "Locked legal/wording decisions" below for why.

## Locked legal/wording decisions — do not revisit without explicit human approval
After discussion, this project chose the lowest-legal-risk design available
(full decoupling of token/NFT value from treasury performance) over a
stronger speculative hook, specifically because there is no legal review
budget for this project. That trade-off was made deliberately and should not
be quietly re-introduced through wording or mechanics later.

Concretely:
- **Never use:** "profit," "returns," "yield," "invest" / "investment,"
  "guaranteed," "backed by," "dividend," "ROI," "your share of," or anything
  implying token/NFT holders are entitled to treasury performance.
- **Buybacks/burns** are ordinary discretionary company actions funded from
  general revenue — never described as a formula tied to treasury/stock
  performance.
- **NFT** = membership/access pass (community access, roles, early access,
  collectible value). **Token** = utility + governance only. Staking unlocks
  tiers/perks, not a performance-linked payout.
- All copy (docs, UI text, social drafts) must be checked against
  `/content/WORDING-RULES.md`. When unsure, flag for human review — don't
  guess and don't soften this list "for marketing reasons."

## Financial/security constraints — hard limits
- **No legal entity is confirmed set up yet.** Do not act as if one exists
  until the human confirms otherwise.
- **Zero budget** beyond domain cost + ~$50 total software spend. Flag any
  paid service, API, or audit before assuming it's in scope.
- **Treasury custody = Safe{Wallet} multisig only.** Never write a custom
  contract that can move treasury funds autonomously.
- **No autonomous mainnet deploys or fund transfers, ever.** Any action that
  touches real money or goes to mainnet requires explicit human sign-off in
  the moment — not a standing approval, not "the plan said this was fine."
- **Contracts = OpenZeppelin templates as the base**, minimal custom logic.
  There is no audit budget, so custom code surface area is the main risk to
  control for.

## Milestone gate — required before entity formation or mainnet
This project is testnet-only for now, deliberately: don't set up a company
until there's something proven worth setting up for. Do not treat the
project as ready for entity formation, mainnet, or real funds until ALL of
the following are true:
- NFT contract deployed on testnet, full mint flow works end-to-end through
  the actual frontend (not just a script call)
- Token contract deployed on testnet, staking/tier logic tested
- Robinhood Chain Stock Token transferability question resolved (treasury
  holds them directly there, or waits for the Base expansion)
- Safe{Wallet} multisig configured and tested with test funds — a real
  transaction in, a real transaction out, signed by the required signers
- Treasury transparency bot correctly indexing/displaying the testnet
  multisig's holdings
- Every piece of public-facing copy checked line by line against
  `content/WORDING-RULES.md` — not just drafted with it in mind
- `docs/STATUS.md` has no (blocked) items open

Entity formation and any mainnet/real-fund activity happen only once every
item above is true — not "close enough," and not on any single session's
say-so.

## Chain plan
- **Primary:** Robinhood Chain (Arbitrum-based L2). Its own Stock Tokens may
  or may not be permissionlessly transferable to third-party contracts —
  this needs to be verified against current Robinhood Chain docs before any
  contract is written to depend on it.
- **Fallback / next:** Base — Backed's bX- tokens and Dinari's dShares are
  confirmed live there.
- **Later:** Solana, matching the existing Jupiter/Helius/Railway stack used
  elsewhere.

## Project structure
- `/contracts` — NFT + token smart contracts → `contracts/CLAUDE.md`
- `/frontend` — mint site, presale page, public treasury dashboard → `frontend/CLAUDE.md`
- `/treasury-bot` — read-only treasury transparency tracker → `treasury-bot/CLAUDE.md`
- `/content` — copy, docs, FAQ, terms, wording rules → `content/CLAUDE.md`
- `/docs/STATUS.md` — shared cross-session status log

## Coordination
Every session reads this file + `/docs/STATUS.md` at the start, and appends
to `/docs/STATUS.md` before ending — what changed, what's next, any
blockers. This matters even more than usual since cross-session coordination
features are still experimental.

**Stale-reference protocol:** if a chat message (from the human, or relayed
from another session) describes an update to a shared file — this one,
`STATUS.md`, `WORDING-RULES.md` — that your own copy of that file doesn't
show, do not proceed on the assumption the chat message is correct. Say so
explicitly and ask for either the real file or the exact text, the same way
the content session handled the WORDING-RULES.md carve-out on 2026-09-05.
This has now happened twice (a chains.ts value, then a wording carve-out)
because the human relays updates by hand and it doesn't always land — that's
a process gap to work around by verifying, not a one-off.
