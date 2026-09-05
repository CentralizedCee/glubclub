"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { tokenContractConfigured } from "@/lib/contracts";
import { copy } from "@/lib/copy";
import { useWrongNetwork } from "@/lib/useWrongNetwork";

export function PresaleCard() {
  const [amount, setAmount] = useState("");
  const { isConnected } = useAccount();
  const { isWrongNetwork } = useWrongNetwork();

  const disabled = !tokenContractConfigured || !isConnected || isWrongNetwork;

  function handleSubmit() {
    // TODO(contracts): wire up once the token contract address and the
    // actual sale mechanism (which function, which payment asset) are
    // confirmed. Left unwired deliberately — no placeholder tx logic.
  }

  return (
    <div className="rounded-2xl border border-line bg-white/60 p-8 max-w-md">
      <h2 className="font-display text-2xl text-ink mb-2">
        {copy.presale.heading}
      </h2>
      <p className="text-sm text-ink/70 mb-4">{copy.presale.body}</p>

      {!tokenContractConfigured && (
        <p className="text-sm text-clay mb-4">{copy.presale.notConfigured}</p>
      )}

      {tokenContractConfigured && isConnected && isWrongNetwork && (
        <p className="text-sm text-red-800 mb-4">
          Wrong network — switch to continue (see banner above).
        </p>
      )}

      <label className="block text-sm text-ink/70 mb-1">
        {copy.presale.amountLabel}
      </label>
      <input
        type="text"
        inputMode="decimal"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        disabled={disabled}
        className="w-full rounded-lg border border-line px-3 py-2 mb-4 disabled:opacity-50"
      />

      <button
        onClick={handleSubmit}
        disabled={disabled}
        className="w-full rounded-full bg-ink px-4 py-3 text-paper font-medium hover:bg-moss transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {copy.presale.submitButton}
      </button>
    </div>
  );
}
