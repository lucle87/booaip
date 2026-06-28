// Theo doi stablecoin tu DefiLlama (free, khong can key).
// Nguon: https://stablecoins.llama.fi/stablecoins?includePrices=true
const UA = "booAIP/1.0";

export async function getStablecoin(symbol?: string) {
  const res = await fetch("https://stablecoins.llama.fi/stablecoins?includePrices=true", {
    headers: { "User-Agent": UA },
    cache: "no-store",
  });
  if (!res.ok) throw new Error("DefiLlama stablecoins HTTP " + res.status);
  const data: any = await res.json();
  let assets: any[] = Array.isArray(data?.peggedAssets) ? data.peggedAssets : [];

  function shape(a: any) {
    const circ = a?.circulating?.peggedUSD ?? null;
    const price = a?.price ?? null;
    const pegDev =
      price != null ? Number(((price - 1) * 100).toFixed(3)) : null;
    return {
      name: a?.name || null,
      symbol: a?.symbol || null,
      pegType: a?.pegType || null,
      circulatingUsd: circ,
      price,
      pegDeviationPct: pegDev,
    };
  }

  if (symbol) {
    const s = symbol.toUpperCase();
    const found = assets.find((a) => (a.symbol || "").toUpperCase() === s);
    if (!found) return { found: false, message: "Stablecoin '" + symbol + "' not found." };
    return { found: true, ...shape(found) };
  }

  assets.sort((a, b) => (b?.circulating?.peggedUSD || 0) - (a?.circulating?.peggedUSD || 0));
  return { found: true, top: assets.slice(0, 10).map(shape) };
}
