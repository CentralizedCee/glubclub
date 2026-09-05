import type { Address } from "viem";
import {
  SAFE_ADDRESS,
  TOKEN_CONTRACT_ADDRESS,
  NFT_CONTRACT_ADDRESS,
  TRACKED_TOKEN_ADDRESSES,
  INITIAL_LOOKBACK_BLOCKS,
  CHAIN_ID,
  safeConfigured,
} from "./config.js";
import { isPlaceholderChain } from "./chain.js";
import { publicClient } from "./client.js";
import { readSafeInfo } from "./safeReads.js";
import { readNativeBalance, readTokenBalance } from "./balances.js";
import { erc721BalanceAbi, erc20Abi } from "./abi.js";
import { getTokenTransferEntries, getNativeIncomingEntries } from "./transfers.js";
import { applyEntries, reconcileAsset, type Discrepancy } from "./reconcile.js";
import { loadState, saveState } from "./state.js";
import { buildOutput, writeOutput, type Holding } from "./output.js";
import type { LedgerEntry } from "./transfers.js";

async function main() {
  if (!safeConfigured || !SAFE_ADDRESS) {
    // Mirrors frontend's "not configured yet" pattern rather than crashing —
    // nothing's deployed as of 2026-09-05, this is expected to run empty
    // until contracts fills in SAFE_ADDRESS.
    console.log(
      "[treasury-bot] SAFE_ADDRESS not set — writing empty/unconfigured output. " +
        "Fill in .env once contracts completes testnet deploy."
    );
    await writeOutput(
      buildOutput({
        safeAddress: null,
        safeInfo: null,
        holdings: [],
        recentTransactions: [],
        discrepancies: [],
        chainId: CHAIN_ID,
        isPlaceholderChain,
      })
    );
    return;
  }

  const state = await loadState();
  const isFirstRun = state.lastProcessedBlock === null;
  const latestBlock = await publicClient.getBlockNumber();
  const fromBlock = isFirstRun
    ? (latestBlock > INITIAL_LOOKBACK_BLOCKS
        ? latestBlock - INITIAL_LOOKBACK_BLOCKS
        : 0n)
    : BigInt(state.lastProcessedBlock!) + 1n;

  if (fromBlock > latestBlock) {
    console.log("[treasury-bot] No new blocks since last run — nothing to do.");
    return;
  }

  const safeInfo = await readSafeInfo(SAFE_ADDRESS);

  const tokenAddresses = Array.from(
    new Set(
      [TOKEN_CONTRACT_ADDRESS, ...TRACKED_TOKEN_ADDRESSES].filter(
        (a): a is Address => a !== null
      )
    )
  );

  const holdings: Holding[] = [];
  const recentTransactions: LedgerEntry[] = [];
  const discrepancies: Discrepancy[] = [];
  const newRunningBalances: Record<string, string> = {};

  // --- Native currency ---
  const nativeActual = await readNativeBalance(SAFE_ADDRESS);
  const nativeIncoming = await getNativeIncomingEntries(
    SAFE_ADDRESS,
    fromBlock,
    latestBlock
  );
  recentTransactions.push(...nativeIncoming);

  if (!isFirstRun) {
    const prevNative = BigInt(state.runningBalances["native"] || "0");
    // Only incoming is traceable (see transfers.ts); outgoing native via
    // execTransaction is invisible to logs/block-scan, so we only apply the
    // incoming side here and let any remaining gap surface as a flagged,
    // clearly-labeled discrepancy rather than a silent number.
    const expectedNative = applyEntries(prevNative, nativeIncoming);
    const nativeDiscrepancy = reconcileAsset(
      "native",
      expectedNative,
      nativeActual,
      isFirstRun,
      true
    );
    if (nativeDiscrepancy) discrepancies.push(nativeDiscrepancy);
  }
  newRunningBalances["native"] = nativeActual.toString();
  holdings.push({
    asset: "native",
    symbol: "ETH",
    rawAmount: nativeActual.toString(),
    decimals: 18,
  });

  // --- Tracked ERC-20s (utility token + any configured Stock Tokens) ---
  for (const tokenAddress of tokenAddresses) {
    const key = tokenAddress.toLowerCase();
    const tokenBalance = await readTokenBalance(SAFE_ADDRESS, tokenAddress);
    const entries = await getTokenTransferEntries(
      SAFE_ADDRESS,
      tokenAddress,
      fromBlock,
      latestBlock
    );
    recentTransactions.push(...entries);

    if (!isFirstRun) {
      const prevBalance = BigInt(state.runningBalances[key] || "0");
      const expected = applyEntries(prevBalance, entries);
      const actual = BigInt(tokenBalance.rawAmount);
      const discrepancy = reconcileAsset(
        tokenBalance.symbol || tokenAddress,
        expected,
        actual,
        isFirstRun,
        false
      );
      if (discrepancy) discrepancies.push(discrepancy);
    }
    newRunningBalances[key] = tokenBalance.rawAmount;
    holdings.push({
      asset: tokenAddress,
      symbol: tokenBalance.symbol,
      rawAmount: tokenBalance.rawAmount,
      decimals: tokenBalance.decimals,
    });
  }

  // --- NFT contract, if configured: informational only (e.g. reserved/
  // unminted passes the treasury might hold) — full Transfer-log tracking
  // intentionally left out for now since ERC-721 transfers are per-tokenId,
  // not amounts, and this bot doesn't need itemized NFT provenance to serve
  // its "what does the company hold" purpose. Revisit if that changes.
  if (NFT_CONTRACT_ADDRESS) {
    try {
      const [balance, symbol] = await Promise.all([
        publicClient.readContract({
          address: NFT_CONTRACT_ADDRESS,
          abi: erc721BalanceAbi,
          functionName: "balanceOf",
          args: [SAFE_ADDRESS],
        }),
        // symbol() shares a selector with ERC-20's, so the ERC-20 ABI
        // fragment works fine here even though this is an ERC-721.
        publicClient
          .readContract({
            address: NFT_CONTRACT_ADDRESS,
            abi: erc20Abi,
            functionName: "symbol",
          })
          .catch(() => "NFT"),
      ]);
      holdings.push({
        asset: NFT_CONTRACT_ADDRESS,
        symbol: symbol as string,
        rawAmount: (balance as bigint).toString(),
        decimals: 0,
      });
    } catch (err) {
      console.warn("[treasury-bot] Could not read NFT balance — skipping.", err);
    }
  }

  await saveState({
    lastProcessedBlock: latestBlock.toString(),
    runningBalances: newRunningBalances,
  });

  await writeOutput(
    buildOutput({
      safeAddress: SAFE_ADDRESS,
      safeInfo,
      holdings,
      recentTransactions,
      discrepancies,
      chainId: CHAIN_ID,
      isPlaceholderChain,
    })
  );

  console.log(
    `[treasury-bot] Poll complete. Blocks ${fromBlock}-${latestBlock}. ` +
      `${discrepancies.length} discrepancy(ies) flagged.`
  );
}

main().catch((err) => {
  console.error("[treasury-bot] Poll failed:", err);
  process.exitCode = 1;
});
