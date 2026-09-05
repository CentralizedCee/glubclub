"use client";

import { useEffect, useState } from "react";
import { copy } from "@/lib/copy";

type ReservesResponse = {
  holdings?: { asset: string; amount: string }[];
};

export function ReservesTable() {
  const apiUrl = process.env.NEXT_PUBLIC_TREASURY_BOT_API_URL;
  const [data, setData] = useState<ReservesResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!apiUrl) return;
    fetch(apiUrl)
      .then((res) => res.json())
      .then(setData)
      .catch(() => setError("Couldn't reach the reserves endpoint."));
  }, [apiUrl]);

  if (!apiUrl) {
    return (
      <p className="text-sm text-clay">{copy.dashboard.notConfigured}</p>
    );
  }

  if (error) {
    return <p className="text-sm text-clay">{error}</p>;
  }

  if (!data) {
    return <p className="text-sm text-ink/60">Loading…</p>;
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-left text-ink/60 border-b border-line">
          <th className="py-2">Asset</th>
          <th className="py-2">Amount held</th>
        </tr>
      </thead>
      <tbody>
        {(data.holdings ?? []).map((row) => (
          <tr key={row.asset} className="border-b border-line/60">
            <td className="py-2">{row.asset}</td>
            <td className="py-2">{row.amount}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
