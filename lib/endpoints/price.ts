// Token price + thanh khoan tu DexScreener (free, khong can key).
// Nguon: https://api.dexscreener.com/latest/dex/tokens/{address}

const UA = "booAIP/1.0 (+https://booaip.vercel.app)";

export async function getTokenPrice(token: string, chain?: string) {
  const addr = token.toLowerCase();
  const url = "https://api.dexscreener.com/latest/dex/tokens/" + addr;
  const res = await fetch(url, { headers: { "User-Agent": UA }, cache: "no-store" });
  if (!res.ok) throw new Error("DexScreener HTTP " + res.status);
  const data: any = await res.json();

  let pairs: any[] = Array.isArray(data?.pairs) ? data.pairs : [];
  // Chi giu cap ma token dang hoi la baseToken (de priceUsd dung la gia token nay).
  pairs = pairs.filter((p) => (p?.baseToken?.address || "").toLowerCase() === addr);
  if (chain) {
    const c = chain.toLowerCase();
    const map: Record<string, string> = { eth: "ethereum", bnb: "bsc", base: "base" };
    const want = map[c] || c;
    const filtered = pairs.filter((p) => (p.chainId || "").toLowerCase() === want);
    if (filtered.length) pairs = filtered;
  }
  if (!pairs.length) {
    return { token: addr, found: false, message: "No DEX pairs found for this token." };
  }

  // Chon cap co thanh khoan cao nhat.
  pairs.sort((a, b) => (b?.liquidity?.usd || 0) - (a?.liquidity?.usd || 0));
  const p = pairs[0];

  return {
    found: true,
    token: addr,
    symbol: p?.baseToken?.symbol || null,
    name: p?.baseToken?.name || null,
    chain: p?.chainId || null,
    dex: p?.dexId || null,
    priceUsd: p?.priceUsd ? Number(p.priceUsd) : null,
    priceChange24hPct: p?.priceChange?.h24 ?? null,
    liquidityUsd: p?.liquidity?.usd ?? null,
    volume24hUsd: p?.volume?.h24 ?? null,
    fdvUsd: p?.fdv ?? null,
    marketCapUsd: p?.marketCap ?? null,
    pairUrl: p?.url || null,
    pairsConsidered: pairs.length,
  };
}
