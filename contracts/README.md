# GlubClub contracts (testnet-only)

Three contracts, each built on OpenZeppelin v5 bases with minimal custom
logic, per `contracts/CLAUDE.md`:

| Contract | Base | Purpose |
|---|---|---|
| `GlubClubToken.sol` | ERC20 + ERC20Votes + ERC20Permit + ERC20Burnable | Utility + governance token only |
| `GlubClubMembership.sol` | ERC721 + ERC721Enumerable + ERC721Burnable + ERC2981 | Membership/access pass |
| `GlubClubStaking.sol` | Ownable + Pausable + ReentrancyGuard | Locks token/NFT to unlock tiers — no payout |

## Why they're built this way

- **No payout logic anywhere.** `GlubClubStaking` only tracks staked
  amounts/duration and exposes a `tierOf(address)` view. It never mints,
  transfers, or distributes anything to a staker, and never reads a price
  feed or treasury balance.
- **Mint proceeds and NFT royalties go to `proceedsRecipient`**, set once
  at deploy to the project's Safe{Wallet} address. Withdrawal requires an
  explicit owner (multisig) transaction each time.
- **Owner should be the Safe**, not an EOA, even on testnet.
- **No treasury custody logic.** None of these contracts can touch the
  Safe's holdings directly.

## Setup

```bash
npm install
npx hardhat compile
npx hardhat test
```

On a normal dev machine with open network access this just works —
Hardhat fetches its own solc binary automatically the first time.

## Tests

27 tests across the three contracts: mint cap enforcement (membership +
token), the allowlist merkle path, pause/unpause on every contract, the
staking tier lookup (including the weighted-average clock), and the
"no function moves value except withdrawProceeds()" invariant.

## Staking duration clock — weighted-average entry time

`stakeTokens` uses a weighted-average entry time: a top-up pulls the
effective start time forward proportionally to how much new stake it
adds, rather than wiping accumulated duration credit outright. See the
`stakeTokens` comment in `GlubClubStaking.sol`.

## Deploying to Robinhood Chain testnet

```bash
cp .env.example .env   # fill in DEPLOYER_PRIVATE_KEY and SAFE_ADDRESS
npm run deploy:testnet
```

Chain ID 46630, RPC `https://rpc.testnet.chain.robinhood.com` — both
independently verified against `docs.robinhood.com/chain/connecting`.
No mainnet network is configured — that's deliberate. Mainnet deployment
needs explicit human sign-off in the moment, per root `CLAUDE.md`.

## Robinhood Chain Stock Token transferability — resolved

Stock Tokens on Robinhood Chain are standard ERC-20 tokens, transferable
to and holdable by any third-party contract, gated only by chain-wide
sequencer-level compliance screening — not by any restriction on
third-party holding specifically. The Safe{Wallet} multisig treasury can
hold Stock Tokens directly on Robinhood Chain; no need to wait for the
Base fallback for that reason.

## Testnet placeholder numbers (deploy.js) — 2026-09-05

Not final mainnet economics — just concrete enough values to exercise the
milestone-gate mint flow: NFT maxSupply 3333, mintPrice 0.01 ETH; Token
maxSupply 100,000,000 GLUB. Final mainnet pricing is a separate, later
decision.

## Not done here yet

- Staking tiers (100 GLUB/0d, 1,000 GLUB/7d, 10,000 GLUB/30d — agreed
  2026-09-05) aren't wired into `scripts/deploy.js` yet. Add a
  `staking.setTiers(...)` call using those numbers before testnet deploy.
- No test exercises the actual frontend mint flow end-to-end — that's
  `/frontend`'s milestone-gate item, not this one.
