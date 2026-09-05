# GlubClub treasury-bot — polling script

Read-only Safe{Wallet} multisig indexer. Built per `treasury-bot/CLAUDE.md`
and root `ROOT-CLAUDE.md`. **No signing authority anywhere in this code** —
there is no wallet client, no private key read from env, no import of any
signing library. Only `createPublicClient` is used.

## Status as of 2026-09-05

Nothing is deployed yet (see `docs/STATUS.md`), so this runs today in its
"unconfigured" state: `npm run poll` with no `.env` writes an empty,
clearly-labeled `output/treasury-ledger.json` instead of erroring — same
pattern frontend uses for its own placeholders. Verified: `npm run typecheck`
passes clean, and a poll with no env set produces valid empty output (both
checked in this environment). **Not yet verified against a live chain** —
this sandbox's network egress doesn't reach any RPC endpoint, only package
registries, so the actual Safe/token/log-reading code paths are type-checked
and reviewed but not live-tested. Test against a real testnet Safe before
trusting the output.

What was resolved 2026-09-05 that shaped this design:
- Robinhood Chain's Stock Tokens are standard ERC-20s → tracked with the
  plain `erc20Abi` fragment in `src/abi.ts`, same as the GlubClub token.
- Safe's hosted Transaction Service doesn't cover Robinhood Chain → this
  reads the Safe singleton (`getOwners`/`getThreshold`/`nonce`) and all
  balances/transfers directly over RPC. `safe-transaction-*.safe.global` is
  not called anywhere.

## Setup

```bash
npm install
cp .env.example .env   # fill in as contracts produces real values
npm run typecheck
npm run poll
```

## What it does each run

1. Reads the Safe's owners/threshold/nonce directly from the Safe contract.
2. Reads native + each tracked ERC-20 balance (`TOKEN_CONTRACT_ADDRESS` +
   `TRACKED_TOKEN_ADDRESSES` — this is where Stock Token addresses go once
   the treasury holds any).
3. Scans `Transfer` event logs since the last run to build a transaction
   list and an *expected* balance per asset.
4. Compares expected vs. the live on-chain balance. Mismatches are written
   to `discrepancies[]` in the output — **never silently corrected** — so
   the public dashboard can show "here's a gap we noticed" rather than
   quietly reconciling it away.
5. Writes `output/treasury-ledger.json` — this is the file to serve at
   whatever URL frontend's `NEXT_PUBLIC_TREASURY_BOT_API_URL` points to.

## Known limitation: native currency outgoing transfers

ERC-20 `Transfer` events fire even when the transfer is triggered by an
internal call (i.e. the Safe's `execTransaction` calling `token.transfer`),
so token tracking is accurate both directions. **Native ETH has no event for
internal-call value transfers** — an outgoing native send executed via
`execTransaction` is invisible to both `eth_getLogs` and plain block
scanning; that needs a trace API (`debug_traceBlock`, or a paid indexer)
that public RPCs generally don't expose. This script therefore only traces
*incoming* native transfers directly; any balance drop it can't explain
shows up as a labeled discrepancy (`note` field says exactly this) rather
than a wrong number presented as right. Worth revisiting only if Robinhood
Chain ships its own explorer API — flagging rather than silently
under-tracking.

## Persisting state across runs — needs a hosting decision

`state/ledger-state.json` (last processed block + running balances) is a
local file. That's fine on a single long-lived host, but **breaks silently
on a stateless runner** (e.g. a fresh GitHub Actions VM every trigger)
unless the workflow restores this file before running and commits it back
after — otherwise every run looks like a first run and loses incremental
reconciliation (it'll still work, just re-baseline instead of catching
drift). Options, in increasing cost:
- GitHub Actions: commit `state/` + `output/` back to the repo each run.
  Free, but adds noisy commits.
- A free-tier hosted KV/DB (Supabase, etc.) — free tier is fine but is an
  account/service to set up, so flagging per the zero-budget rule rather
  than picking one unasked.
- A single always-on free host (e.g. a Render/Railway free instance) with
  real disk — simplest code-wise, but "free" tiers here often sleep/reset,
  which would have the same problem as a stateless runner.

Not resolved here — needs a human call once actual hosting is picked.

## Before this goes further

- [ ] Contracts: fill in `SAFE_ADDRESS` after Safe is configured on testnet.
- [ ] Contracts: fill in `TOKEN_CONTRACT_ADDRESS` / `NFT_CONTRACT_ADDRESS`
      after deploy, and `TRACKED_TOKEN_ADDRESSES` once the Safe actually
      holds any Stock Tokens.
- [ ] Contracts/human: confirm the real Robinhood Chain testnet
      `CHAIN_ID`/`RPC_URL` and update `.env` — `src/chain.ts` picks these up
      automatically, no code change needed unless the real chain needs
      custom serializers.
- [ ] Human: pick a state-persistence + hosting approach (see above) before
      relying on this for anything beyond local testing.
- [ ] Whoever wires up `/frontend`'s dashboard: point
      `NEXT_PUBLIC_TREASURY_BOT_API_URL` at wherever `output/treasury-ledger.json`
      ends up served from.
- [ ] Content: the `disclaimer` field in the output is placeholder text —
      final wording is `/content`'s call against `WORDING-RULES.md`.
