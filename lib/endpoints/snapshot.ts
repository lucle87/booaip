// Token snapshot: gop gia (DexScreener) + cung (on-chain) + safety (GoPlus)
// vao MOT call. Goi song song, chiu loi tung nguon (mot nguon hong van tra phan con lai).
import { getTokenPrice } from "@/lib/endpoints/price";
import { getSupply } from "@/lib/endpoints/supply";
import { fetchSafety } from "@/lib/goplus";

function quickVerdict(safety: any): { verdict: string; flags: string[] } {
  const flags: string[] = [];
  if (!safety?.available) return { verdict: "UNKNOWN", flags: ["no safety data"] };
  if (safety.isHoneypot === true || safety.cannotSellAll === true) flags.push("honeypot");
  const hiTax = Math.max(safety.buyTaxPct ?? 0, safety.sellTaxPct ?? 0);
  if (hiTax >= 50) flags.push("extreme_tax");
  else if (hiTax >= 10) flags.push("high_tax");
  if ((safety.topHolderPct ?? 0) >= 50) flags.push("whale_concentration");
  if (safety.canTakeBackOwnership || safety.hiddenOwner) flags.push("owner_privileges");
  if (safety.isOpenSource === false) flags.push("unverified");

  let verdict = "OK";
  if (flags.includes("honeypot") || flags.includes("extreme_tax")) verdict = "DANGER";
  else if (flags.length) verdict = "CAUTION";
  return { verdict, flags };
}

export async function getSnapshot(token: string, chain: string) {
  const [priceR, supplyR, safetyR] = await Promise.allSettled([
    getTokenPrice(token, chain),
    getSupply(token, chain),
    fetchSafety(chain, token),
  ]);

  const price = priceR.status === "fulfilled" ? priceR.value : null;
  const supply = supplyR.status === "fulfilled" ? supplyR.value : null;
  const safety = safetyR.status === "fulfilled" ? safetyR.value : null;

  const sv = quickVerdict(safety);

  return {
    token,
    chain,
    safetyVerdict: sv.verdict, // OK | CAUTION | DANGER | UNKNOWN
    riskFlags: sv.flags,
    market: price && (price as any).found
      ? {
          symbol: (price as any).symbol,
          name: (price as any).name,
          priceUsd: (price as any).priceUsd,
          priceChange24hPct: (price as any).priceChange24hPct,
          liquidityUsd: (price as any).liquidityUsd,
          volume24hUsd: (price as any).volume24hUsd,
          fdvUsd: (price as any).fdvUsd,
          marketCapUsd: (price as any).marketCapUsd,
          dex: (price as any).dex,
        }
      : { found: false, note: "No DEX market data found." },
    supply: supply && (supply as any).found
      ? {
          decimals: (supply as any).decimals,
          totalSupply: (supply as any).totalSupply,
        }
      : { found: false },
    safety: safety && safety.available
      ? {
          honeypot: safety.isHoneypot,
          cannotSellAll: safety.cannotSellAll,
          buyTaxPct: safety.buyTaxPct,
          sellTaxPct: safety.sellTaxPct,
          holderCount: safety.holderCount,
          topHolderPct: safety.topHolderPct,
          top10Pct: safety.top10Pct,
          mintable: safety.isMintable,
          canTakeBackOwnership: safety.canTakeBackOwnership,
          hiddenOwner: safety.hiddenOwner,
          openSource: safety.isOpenSource,
        }
      : { available: false, note: "No GoPlus safety data for this token/chain." },
    note: "Aggregated snapshot: market (DexScreener) + supply (on-chain) + safety (GoPlus) in one call. safetyVerdict is a quick read, not a full audit; use the rug-check service for a deeper verdict.",
  };
}
