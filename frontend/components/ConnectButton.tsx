"use client";

import { useAccount, useConnect, useDisconnect } from "wagmi";

function short(address: string) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function ConnectButton() {
  const { address, isConnected } = useAccount();
  const { connectors, connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  if (isConnected && address) {
    return (
      <button
        onClick={() => disconnect()}
        className="rounded-full border border-line px-4 py-2 text-sm font-medium text-ink hover:border-moss hover:text-moss transition-colors"
      >
        {short(address)} · Disconnect
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {connectors.map((connector) => (
        <button
          key={connector.uid}
          onClick={() => connect({ connector })}
          disabled={isPending}
          className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper hover:bg-moss transition-colors disabled:opacity-50"
        >
          {isPending ? "Connecting…" : `Connect ${connector.name}`}
        </button>
      ))}
    </div>
  );
}
