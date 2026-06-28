// Token supply/info doc on-chain qua viem (ERC-20).
import { isAddress, formatUnits } from "viem";
import { clientFor } from "@/lib/evm";

const ERC20 = [
  { name: "name", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "string" }] },
  { name: "symbol", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "string" }] },
  { name: "decimals", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint8" }] },
  { name: "totalSupply", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
] as const;

export async function getSupply(token: string, chain: string) {
  if (!isAddress(token)) throw new Error("Invalid token address.");
  const client = clientFor(chain);
  const addr = token as `0x${string}`;

  const [name, symbol, decimals, totalSupply] = await Promise.all([
    client.readContract({ address: addr, abi: ERC20 as any, functionName: "name" }).catch(() => null),
    client.readContract({ address: addr, abi: ERC20 as any, functionName: "symbol" }).catch(() => null),
    client.readContract({ address: addr, abi: ERC20 as any, functionName: "decimals" }).catch(() => null),
    client.readContract({ address: addr, abi: ERC20 as any, functionName: "totalSupply" }).catch(() => null),
  ]);

  if (decimals == null || totalSupply == null) {
    return { found: false, token: addr, chain, message: "Not a standard ERC-20 token on this chain." };
  }
  const dec = Number(decimals);
  return {
    found: true,
    token: addr,
    chain,
    name: (name as string) || null,
    symbol: (symbol as string) || null,
    decimals: dec,
    totalSupply: formatUnits(totalSupply as bigint, dec),
    totalSupplyRaw: (totalSupply as bigint).toString(),
  };
}
