// Helper tao viem public client cho cac endpoint doc on-chain.
import { createPublicClient, http } from "viem";
import { mainnet, base, bsc } from "viem/chains";
import { rpcFor } from "@/lib/x402config";

const CHAINS: Record<string, any> = {
  eth: mainnet,
  ethereum: mainnet,
  base: base,
  bnb: bsc,
  bsc: bsc,
};

export function clientFor(chain: string) {
  const c = chain.toLowerCase();
  const chainObj = CHAINS[c];
  if (!chainObj) throw new Error("Unsupported chain: " + chain + " (use eth, bnb, base).");
  const rpc = rpcFor(c);
  return createPublicClient({ chain: chainObj, transport: http(rpc, { timeout: 6000, retryCount: 1, retryDelay: 300 }) });
}
