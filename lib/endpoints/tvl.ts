// DeFi protocol TVL tu DefiLlama (free, khong can key).
// Nguon: https://api.llama.fi/protocol/{slug}

const UA = "booAIP/1.0 (+https://booaip.vercel.app)";
import { fetchWithTimeout } from "@/lib/http";

export async function getProtocolTvl(slug: string) {
  const s = slug.toLowerCase().trim().replace(/\s+/g, "-");
  const url = "https://api.llama.fi/protocol/" + encodeURIComponent(s);
  const res = await fetchWithTimeout(url, { timeoutMs: 6000, headers: { "User-Agent": UA } });
  if (res.status === 404) {
    return { protocol: s, found: false, message: "Protocol not found on DefiLlama. Use the DefiLlama slug (e.g. 'aave', 'uniswap', 'lido')." };
  }
  if (!res.ok) throw new Error("DefiLlama HTTP " + res.status);
  const data: any = await res.json();

  const series: any[] = Array.isArray(data?.tvl) ? data.tvl : [];
  const last = series.length ? series[series.length - 1]?.totalLiquidityUSD : null;

  // chains: uu tien data.chains; neu rong, suy ra tu currentChainTvls (bo cac hau to staking/borrowed/pool2).
  let chains: string[] = Array.isArray(data?.chains) ? data.chains : [];
  if (!chains.length && data?.currentChainTvls && typeof data.currentChainTvls === "object") {
    chains = Object.keys(data.currentChainTvls).filter(
      (k) => !k.includes("-")
    );
  }

  function ago(days: number): number | null {
    if (series.length <= days) return null;
    return series[series.length - 1 - days]?.totalLiquidityUSD ?? null;
  }
  function pct(now: number | null, then: number | null): number | null {
    if (now == null || then == null || then === 0) return null;
    return Number((((now - then) / then) * 100).toFixed(2));
  }

  const d1 = ago(1);
  const d7 = ago(7);

  return {
    found: true,
    protocol: data?.name || s,
    slug: s,
    symbol: data?.symbol || null,
    category: data?.category || null,
    chains: Array.isArray(data?.chains) ? data.chains : [],
    tvlUsd: last,
    change1dPct: pct(last, d1),
    change7dPct: pct(last, d7),
    url: data?.url || null,
  };
}
