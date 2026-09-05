"use client";

import { useSwitchChain } from "wagmi";
import { activeChain } from "@/lib/chains";
import { useWrongNetwork } from "@/lib/useWrongNetwork";

export function NetworkGuard() {
  const { isWrongNetwork } = useWrongNetwork();
  const { switchChain, isPending, error } = useSwitchChain();

  if (!isWrongNetwork) return null;

  return (
    <div className="w-full bg-red-50 border-b border-red-200 px-4 py-3 text-center text-sm text-red-900">
      <p className="mb-1">
        Your wallet isn&apos;t connected to {activeChain.name}. Switch
        networks to use mint or token access.
      </p>
      <button
        onClick={() => switchChain({ chainId: activeChain.id })}
        disabled={isPending}
        className="rounded-full bg-red-900 px-4 py-1.5 text-white text-sm font-medium hover:bg-red-950 transition-colors disabled:opacity-50"
      >
        {isPending ? "Switching…" : `Switch to ${activeChain.name}`}
      </button>
      {error && (
        <p className="mt-2 text-xs text-red-800">
          Couldn&apos;t switch automatically. Add the network manually — see{" "}
          <a
            href="https://docs.robinhood.com/chain/add-network-to-wallet"
            target="_blank"
            rel="noreferrer"
            className="underline"
          >
            docs.robinhood.com/chain/add-network-to-wallet
          </a>
          .
        </p>
      )}
    </div>
  );
}
