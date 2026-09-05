"use client";

import { useState } from "react";
import { useAccount, useWriteContract } from "wagmi";
import {
  NFT_CONTRACT_ADDRESS,
  nftAbiPlaceholder,
  nftContractConfigured,
} from "@/lib/contracts";
import { copy } from "@/lib/copy";
import { useWrongNetwork } from "@/lib/useWrongNetwork";

export function MintCard() {
  const [quantity, setQuantity] = useState(1);
  const { isConnected } = useAccount();
  const { isWrongNetwork } = useWrongNetwork();
  const { writeContract, isPending } = useWriteContract();

  const disabled =
    !nftContractConfigured || !isConnected || isWrongNetwork || isPending;

  function handleMint() {
    // TODO(contracts): confirm real mint price/payable value once the
    // contract is deployed — this is intentionally not wired to submit
    // until nftContractConfigured is true, so it can't silently call a
    // zero address.
    if (!nftContractConfigured) return;
    writeContract({
      address: NFT_CONTRACT_ADDRESS,
      abi: nftAbiPlaceholder,
      functionName: "mint",
      args: [BigInt(quantity)],
    });
  }

  return (
    <div className="rounded-2xl border border-line bg-white/60 p-8 max-w-md">
      <h2 className="font-display text-2xl text-ink mb-2">
        {copy.mint.heading}
      </h2>

      {!nftContractConfigured && (
        <p className="text-sm text-clay mb-4">{copy.mint.notConfigured}</p>
      )}

      {nftContractConfigured && !isConnected && (
        <p className="text-sm text-ink/70 mb-4">{copy.mint.connectPrompt}</p>
      )}

      {nftContractConfigured && isConnected && isWrongNetwork && (
        <p className="text-sm text-red-800 mb-4">
          Wrong network — switch to mint (see banner above).
        </p>
      )}

      <label className="block text-sm text-ink/70 mb-1">
        {copy.mint.quantityLabel}
      </label>
      <input
        type="number"
        min={1}
        max={10}
        value={quantity}
        onChange={(e) => setQuantity(Number(e.target.value))}
        disabled={disabled}
        className="w-full rounded-lg border border-line px-3 py-2 mb-4 disabled:opacity-50"
      />

      <button
        onClick={handleMint}
        disabled={disabled}
        className="w-full rounded-full bg-ink px-4 py-3 text-paper font-medium hover:bg-moss transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {isPending ? copy.mint.pendingButton : copy.mint.mintButton}
      </button>
    </div>
  );
}
