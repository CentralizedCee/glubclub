import { useAccount } from "wagmi";
import { activeChain } from "@/lib/chains";

export function useWrongNetwork() {
  const { isConnected, chainId } = useAccount();
  const isWrongNetwork = isConnected && chainId !== activeChain.id;
  return { isWrongNetwork, isConnected, chainId };
}
