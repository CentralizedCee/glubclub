import type { Address } from "viem";
import { publicClient } from "./client.js";
import { erc20Abi } from "./abi.js";

export interface TokenBalance {
  address: Address;
  symbol: string;
  decimals: number;
  /** Raw on-chain integer amount, as a string (avoid float precision loss). */
  rawAmount: string;
}

export async function readNativeBalance(
  address: Address
): Promise<bigint> {
  return publicClient.getBalance({ address });
}

export async function readTokenBalance(
  safeAddress: Address,
  tokenAddress: Address
): Promise<TokenBalance> {
  const [balance, decimals, symbol] = await Promise.all([
    publicClient.readContract({
      address: tokenAddress,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [safeAddress],
    }),
    publicClient.readContract({
      address: tokenAddress,
      abi: erc20Abi,
      functionName: "decimals",
    }),
    publicClient.readContract({
      address: tokenAddress,
      abi: erc20Abi,
      functionName: "symbol",
    }),
  ]);

  return {
    address: tokenAddress,
    symbol: symbol as string,
    decimals: Number(decimals),
    rawAmount: (balance as bigint).toString(),
  };
}
