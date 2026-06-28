// GoPlus Token Security (EVM) cho lop safety cua snapshot. Free, khong key.
// chain_id: eth=1, bnb=56, base=8453.
import { cached } from "@/lib/cache";

const UA = "booAIP/1.0";

export function chainIdFor(chain: string): number | null {
  const c = chain.toLowerCase();
  if (c === "eth" || c === "ethereum") return 1;
  if (c === "bnb" || c === "bsc") return 56;
  if (c === "base") return 8453;
  return null;
}

export type Safety = {
  available: boolean;
  isHoneypot: boolean | null;
  cannotSellAll: boolean | null;
  buyTaxPct: number | null;
  sellTaxPct: number | null;
  holderCount: number | null;
  topHolderPct: number | null;
  top10Pct: number | null;
  isMintable: boolean | null;
  canTakeBackOwnership: boolean | null;
  hiddenOwner: boolean | null;
  isOpenSource: boolean | null;
};

const EMPTY: Safety = {
  available: false, isHoneypot: null, cannotSellAll: null, buyTaxPct: null, sellTaxPct: null,
  holderCount: null, topHolderPct: null, top10Pct: null, isMintable: null,
  canTakeBackOwnership: null, hiddenOwner: null, isOpenSource: null,
};

function b(v: any): boolean | null { if (v === "1") return true; if (v === "0") return false; return null; }
function num(v: any): number | null { if (v == null || v === "") return null; const n = Number(v); return Number.isFinite(n) ? n : null; }
function pct(v: any): number | null { const n = num(v); return n == null ? null : Number((n * 100).toFixed(2)); }

export async function fetchSafety(chain: string, token: string): Promise<Safety> {
  const chainId = chainIdFor(chain);
  if (!chainId) return EMPTY;
  const addr = token.toLowerCase();
  const key = "goplus:" + chainId + ":" + addr;
  try {
    return await cached(key, 60000, async () => {
      const url = "https://api.gopluslabs.io/api/v1/token_security/" + chainId + "?contract_addresses=" + addr;
      const res = await fetch(url, { headers: { "User-Agent": UA }, cache: "no-store" });
      if (!res.ok) return EMPTY;
      const data: any = await res.json();
      const rec = data?.result?.[addr];
      if (!rec) return EMPTY;
      const holders: any[] = Array.isArray(rec.holders) ? rec.holders : [];
      const real = holders.filter((h) => {
        const tag = (h.tag || "").toLowerCase();
        if (tag.includes("lock") || tag.includes("burn")) return false;
        if (h.is_locked === 1 || h.is_locked === "1") return false;
        return true;
      });
      const pcts = real.map((h) => pct(h.percent)).filter((x): x is number => x != null).sort((a, b2) => b2 - a);
      return {
        available: true,
        isHoneypot: b(rec.is_honeypot),
        cannotSellAll: b(rec.cannot_sell_all),
        buyTaxPct: pct(rec.buy_tax),
        sellTaxPct: pct(rec.sell_tax),
        holderCount: num(rec.holder_count),
        topHolderPct: pcts.length ? pcts[0] : null,
        top10Pct: pcts.length ? Number(pcts.slice(0, 10).reduce((s, x) => s + x, 0).toFixed(2)) : null,
        isMintable: b(rec.is_mintable),
        canTakeBackOwnership: b(rec.can_take_back_ownership),
        hiddenOwner: b(rec.hidden_owner),
        isOpenSource: b(rec.is_open_source),
      } as Safety;
    });
  } catch {
    return EMPTY;
  }
}
