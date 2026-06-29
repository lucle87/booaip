// Tong quan TVL theo chain tu DefiLlama (free, khong can key).
// Nguon: https://api.llama.fi/v2/chains
const UA = "booAIP/1.0";
import { fetchJson } from "@/lib/http";

export async function getChain(chain?: string) {
  let arr: any[] = await fetchJson("https://api.llama.fi/v2/chains", { timeoutMs: 6000, headers: { "User-Agent": UA } });
  if (!Array.isArray(arr)) arr = [];
  arr.sort((a, b) => (b.tvl || 0) - (a.tvl || 0));
  const total = arr.reduce((s, c) => s + (c.tvl || 0), 0);

  if (chain) {
    const c = chain.toLowerCase();
    const idx = arr.findIndex(
      (x) => (x.name || "").toLowerCase() === c || (x.tokenSymbol || "").toLowerCase() === c
    );
    if (idx < 0) return { found: false, message: "Chain '" + chain + "' not found." };
    const x = arr[idx];
    return {
      found: true,
      chain: x.name,
      tvlUsd: x.tvl ?? null,
      rank: idx + 1,
      dominancePct: total ? Number((((x.tvl || 0) / total) * 100).toFixed(2)) : null,
      tokenSymbol: x.tokenSymbol || null,
    };
  }

  return {
    found: true,
    totalTvlUsd: total,
    top: arr.slice(0, 10).map((x, i) => ({
      rank: i + 1,
      chain: x.name,
      tvlUsd: x.tvl ?? null,
      dominancePct: total ? Number((((x.tvl || 0) / total) * 100).toFixed(2)) : null,
    })),
  };
}
