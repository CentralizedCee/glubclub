# GlubClub frontend — scaffold

Testnet-only scaffold for the mint site, token/presale page, and treasury
dashboard. Built per `frontend/CLAUDE.md` and the project root
`ROOT-CLAUDE.md`.

## Status as of 2026-09-05

Per `docs/STATUS.md`, contracts hasn't deployed anything yet and the
treasury bot hasn't been built yet. So this is a **working scaffold, not a
live app**:

- Mint and token-access UI render, wallet connect works, but both actions
  are disabled with an explanatory message until real contract addresses
  are set in `.env.local` (see `lib/contracts.ts`).
- The reserves dashboard shows a "not configured" message until
  `NEXT_PUBLIC_TREASURY_BOT_API_URL` points at something real.
- Chain config is now real: Robinhood Chain Testnet, chain ID 46630, verified
  2026-09-05 against `docs.robinhood.com/chain/connecting` (not just taken from
  a chat message — that message wasn't reflected in `docs/STATUS.md`, so the
  chain ID and RPC URL were independently checked against Robinhood's own
  docs before landing here). Uses Robinhood's public RPC by default
  (rate-limited per their docs, no signup); override with an Alchemy testnet
  key via `NEXT_PUBLIC_RPC_URL` if that becomes a problem. See `lib/chains.ts`.
- Wrong-network detection: if a connected wallet is on a different chain, a
  banner prompts switching (or shows manual add-network instructions if the
  wallet can't switch automatically) rather than letting mint/token actions
  silently fail. See `components/NetworkGuard.tsx` and `lib/useWrongNetwork.ts`.
- All UI copy is placeholder text, marked `[PLACEHOLDER COPY]` inline (see
  `lib/copy.ts`), and deliberately avoids the banned wording in
  `content/WORDING-RULES.md` in case it ships by accident. Real copy is
  `/content`'s job, not this session's — swap `lib/copy.ts` values once
  final wording lands.

## Stack (zero recurring cost)

- Next.js 14 (App Router) + TypeScript + Tailwind
- wagmi v2 + viem for wallet connection and contract calls
- Connectors: browser-injected wallets only (MetaMask, Rabby, Brave, etc.)
  — free, **no signup required**. Coinbase Wallet's connector is left out
  (its current dependency chain breaks the build — see `lib/wagmi.ts` for
  why) and WalletConnect is stubbed out since it needs a free WalletConnect
  Cloud account; both flagged rather than silently included or omitted.
- Hosting: designed for Vercel or Netlify free tier. No paid services
  anywhere in this scaffold.

## Known-safe build warnings

`npm run build` prints warnings about `@react-native-async-storage/async-storage`
and `pino-pretty` not being found. Both are optional peer deps of packages
wagmi's connectors pull in for environments this app doesn't target (React
Native, pretty dev logging) — safe to ignore, build still succeeds.

## Setup

```bash
npm install
cp .env.example .env.local   # fill in as other sessions produce real values
npm run dev
```

## Before this goes further

- [x] Chain config: Robinhood Chain Testnet (46630) verified and wired up.
- [ ] Contracts: fill in `NEXT_PUBLIC_NFT_CONTRACT_ADDRESS` /
      `NEXT_PUBLIC_TOKEN_CONTRACT_ADDRESS` after testnet deploy, and swap
      the placeholder ABIs in `lib/contracts.ts` for the real generated ones.
- [ ] Treasury bot: fill in `NEXT_PUBLIC_TREASURY_BOT_API_URL` once it
      exposes an endpoint.
- [ ] Content: replace everything in `lib/copy.ts` with final, wording-rule-
      checked copy.
- [ ] Whoever wires up mint/presale for real: confirm mint price and the
      presale's actual payment mechanism before un-stubbing
      `PresaleCard`'s submit handler — it's intentionally left unwired.
