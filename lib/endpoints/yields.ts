// Tim pool APY cao tu DefiLlama yields (free, khong can key) + LOP LOC RUI RO.
// Nguon: https://yields.llama.fi/pools
const UA = "booAIP/1.0";

const EXTREME_APY = 1000;   // APY > 1000% gan co (gan nhu luon la bay/pool rac).
const LOW_TVL = 100000;     // TVL < 100k USD gan co (de rug, thanh khoan mong).

function flagsFor(p: any): string[] {
  const f: string[] = [];
  if ((p.apy || 0) > EXTREME_APY) f.push("extreme_apy");
  if ((p.tvlUsd || 0) < LOW_TVL) f.push("low_tvl");
  if ((p.ilRisk || "").toLowerCase() === "yes") f.push("impermanent_loss");
  return f;
}

export async function getYields(
  symbol?: string,
  chain?: string,
  limit = 5,
  safeOnly = false
) {
  const res = await fetch("https://yields.llama.fi/pools", {
    headers: { "User-Agent": UA },
    cache: "no-store",
  });
  if (!res.ok) throw new Error("DefiLlama yields HTTP " + res.status);
  const data: any = await res.json();
  let pools: any[] = Array.isArray(data?.data) ? data.data : [];

  if (symbol) {
    const s = symbol.toUpperCase();
    pools = pools.filter((p) => (p.symbol || "").toUpperCase().includes(s));
  }
  if (chain) {
    const c = chain.toLowerCase();
    const map: Record<string, string> = { eth: "ethereum", bnb: "bsc" };
    const want = map[c] || c;
    pools = pools.filter((p) => (p.chain || "").toLowerCase() === want);
  }

  let shaped = pools.map((p) => {
    const riskFlags = flagsFor(p);
    return {
      project: p.project,
      chain: p.chain,
      symbol: p.symbol,
      apyPct: p.apy != null ? Number(Number(p.apy).toFixed(2)) : null,
      apyBasePct: p.apyBase != null ? Number(Number(p.apyBase).toFixed(2)) : null,
      apyRewardPct: p.apyReward != null ? Number(Number(p.apyReward).toFixed(2)) : null,
      tvlUsd: p.tvlUsd ?? null,
      stablecoin: !!p.stablecoin,
      riskFlags,
      suspicious: riskFlags.includes("extreme_apy") || riskFlags.includes("low_tvl"),
    };
  });

  // Loc an toan: chi giu pool khong suspicious.
  if (safeOnly) shaped = shaped.filter((p) => !p.suspicious);

  shaped.sort((a, b) => (b.apyPct || 0) - (a.apyPct || 0));
  const top = shaped.slice(0, Math.min(Math.max(limit, 1), 20));

  const suspiciousCount = top.filter((p) => p.suspicious).length;

  return {
    query: { symbol: symbol || null, chain: chain || null, safeOnly },
    count: top.length,
    note:
      "riskFlags: extreme_apy = APY > 1000% (almost always a trap), low_tvl = TVL < $100k (thin liquidity, rug-prone), impermanent_loss = volatile pair. 'suspicious' pools should be treated with caution. Pass safeOnly:true to drop them.",
    suspiciousInResult: suspiciousCount,
    pools: top,
  };
}
