import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";

const STATE_PATH = "state/ledger-state.json";

export interface LedgerState {
  /** Last block number this script has fully processed. Null = never run. */
  lastProcessedBlock: string | null;
  /**
   * Running balance per asset key ("native" or a lowercased token address),
   * as computed from summed transfers — NOT re-read from chain each time.
   * Compared against the live on-chain balance each run to catch drift.
   * Stored as strings since JSON can't hold bigint.
   */
  runningBalances: Record<string, string>;
}

const EMPTY_STATE: LedgerState = {
  lastProcessedBlock: null,
  runningBalances: {},
};

export async function loadState(): Promise<LedgerState> {
  try {
    const raw = await readFile(STATE_PATH, "utf-8");
    return JSON.parse(raw) as LedgerState;
  } catch {
    // No state file yet (first run, or fresh checkout) — start clean rather
    // than erroring. This is expected the first time this runs against a
    // freshly deployed testnet Safe.
    return structuredClone(EMPTY_STATE);
  }
}

export async function saveState(state: LedgerState): Promise<void> {
  await mkdir(dirname(STATE_PATH), { recursive: true });
  await writeFile(STATE_PATH, JSON.stringify(state, null, 2));
}

/**
 * NOTE ON DEPLOYMENT: this reads/writes a local file. That's fine for a
 * single long-lived host, but breaks silently on stateless/ephemeral
 * runners (e.g. a fresh GitHub Actions VM every run) unless the workflow
 * restores this file first and commits it back after — every run would
 * otherwise look like a "first run" and lose incremental reconciliation.
 * Flagging rather than picking a hosted-KV solution unasked, since that's
 * a recurring-cost decision per root CLAUDE.md's budget rule. See README.
 */
