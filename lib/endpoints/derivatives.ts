// Multi-exchange derivatives: funding rate + open interest tu Binance, Bybit,
// OKX (CEX, chu ky funding 8h) va Hyperliquid (perp DEX, chu ky funding 1h).
// Chuan hoa funding ve APR nam de so cong bang giua cac san, roi tinh do lech.
// Tat ca tu API public, KHONG can key. Goi song song, mot san loi khong sap ca.
//
// Bai toan giai: agent trading muon biet funding/OI tren cac san lon, va co lech
// bat thuong khong (tin hieu sentiment / co hoi arbitrage funding).

const UA = "booAIP/1.0 (+https://booaip.vercel.app)";

import { fetchJson } from "@/lib/http";
import { cached } from "@/lib/cache";

// Moi san timeout 4s: san nao cham bi bo qua (ok=false), khong keo ca endpoint.
async function getJson(url: string, init?: { method?: string; headers?: Record<string, string>; body?: string }): Promise<any> {
  return fetchJson(url, { timeoutMs: 4000, method: init?.method, headers: init?.headers, body: init?.body });
}

type Venue = {
  exchange: string;
  fundingRate: number | null;
  fundingIntervalHours: number;
  fundingAprPct: number | null;
  openInterestUsd: number | null;
  markPrice: number | null;
  ok: boolean;
};

function aprPct(rate: number | null, intervalHours: number): number | null {
  if (rate == null) return null;
  const periodsPerYear = (24 / intervalHours) * 365;
  return Number((rate * periodsPerYear * 100).toFixed(2));
}

function dead(ex: string, ivl: number): Venue {
  return { exchange: ex, fundingRate: null, fundingIntervalHours: ivl, fundingAprPct: null, openInterestUsd: null, markPrice: null, ok: false };
}

async function binance(sym: string): Promise<Venue> {
  try {
    const s = sym + "USDT";
    const [pi, oi] = await Promise.all([
      getJson("https://fapi.binance.com/fapi/v1/premiumIndex?symbol=" + s),
      getJson("https://fapi.binance.com/fapi/v1/openInterest?symbol=" + s),
    ]);
    const rate = pi?.lastFundingRate != null ? Number(pi.lastFundingRate) : null;
    const mark = pi?.markPrice != null ? Number(pi.markPrice) : null;
    const oiCoin = oi?.openInterest != null ? Number(oi.openInterest) : null;
    const oiUsd = oiCoin != null && mark != null ? oiCoin * mark : null;
    return { exchange: "binance", fundingRate: rate, fundingIntervalHours: 8, fundingAprPct: aprPct(rate, 8), openInterestUsd: oiUsd != null ? Math.round(oiUsd) : null, markPrice: mark, ok: rate != null };
  } catch { return dead("binance", 8); }
}

// Long/short ACCOUNT ratio cua Binance (free): bao nhieu % tai khoan dang long vs short.
// Tin hieu "dam dong nghieng dau" - bo sung cho funding (ai tra phi). Fail mem (null).
async function longShort(sym: string): Promise<any> {
  try {
    const s = sym + "USDT";
    const arr = await getJson(
      "https://fapi.binance.com/futures/data/globalLongShortAccountRatio?symbol=" + s + "&period=1h&limit=1"
    );
    const r = Array.isArray(arr) && arr.length ? arr[arr.length - 1] : null;
    if (!r) return null;
    const ratio = r?.longShortRatio != null ? Number(r.longShortRatio) : null;
    const longPct = r?.longAccount != null ? Number(r.longAccount) * 100 : null;
    const shortPct = r?.shortAccount != null ? Number(r.shortAccount) * 100 : null;
    if (ratio == null && longPct == null) return null;
    return {
      source: "binance",
      longShortRatio: ratio != null ? Number(ratio.toFixed(3)) : null,
      longAccountPct: longPct != null ? Number(longPct.toFixed(1)) : null,
      shortAccountPct: shortPct != null ? Number(shortPct.toFixed(1)) : null,
    };
  } catch {
    return null;
  }
}

async function bybit(sym: string): Promise<Venue> {
  try {
    const s = sym + "USDT";
    const r = await getJson("https://api.bybit.com/v5/market/tickers?category=linear&symbol=" + s);
    const t = r?.result?.list?.[0];
    const rate = t?.fundingRate != null && t.fundingRate !== "" ? Number(t.fundingRate) : null;
    const ivl = t?.fundingIntervalHour ? Number(t.fundingIntervalHour) : 8;
    const oiUsd = t?.openInterestValue != null && t.openInterestValue !== "" ? Number(t.openInterestValue) : null;
    const mark = t?.markPrice != null && t.markPrice !== "" ? Number(t.markPrice) : null;
    return { exchange: "bybit", fundingRate: rate, fundingIntervalHours: ivl, fundingAprPct: aprPct(rate, ivl), openInterestUsd: oiUsd != null ? Math.round(oiUsd) : null, markPrice: mark, ok: rate != null };
  } catch { return dead("bybit", 8); }
}

async function okx(sym: string): Promise<Venue> {
  try {
    const inst = sym + "-USDT-SWAP";
    const [fr, oi] = await Promise.all([
      getJson("https://www.okx.com/api/v5/public/funding-rate?instId=" + inst),
      getJson("https://www.okx.com/api/v5/public/open-interest?instId=" + inst),
    ]);
    const rate = fr?.data?.[0]?.fundingRate != null ? Number(fr.data[0].fundingRate) : null;
    const oiUsd = oi?.data?.[0]?.oiUsd != null ? Number(oi.data[0].oiUsd) : null;
    return { exchange: "okx", fundingRate: rate, fundingIntervalHours: 8, fundingAprPct: aprPct(rate, 8), openInterestUsd: oiUsd != null ? Math.round(oiUsd) : null, markPrice: null, ok: rate != null };
  } catch { return dead("okx", 8); }
}

async function hyperliquid(sym: string): Promise<Venue> {
  try {
    const r = await getJson("https://api.hyperliquid.xyz/info", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ type: "metaAndAssetCtxs" }),
    });
    const universe: any[] = r?.[0]?.universe || [];
    const ctxs: any[] = r?.[1] || [];
    const idx = universe.findIndex((u) => (u?.name || "").toUpperCase() === sym.toUpperCase());
    if (idx < 0) return dead("hyperliquid", 1);
    const c = ctxs[idx] || {};
    const rate = c?.funding != null ? Number(c.funding) : null;
    const mark = c?.markPx != null ? Number(c.markPx) : null;
    const oiCoin = c?.openInterest != null ? Number(c.openInterest) : null;
    const oiUsd = oiCoin != null && mark != null ? oiCoin * mark : null;
    return { exchange: "hyperliquid", fundingRate: rate, fundingIntervalHours: 1, fundingAprPct: aprPct(rate, 1), openInterestUsd: oiUsd != null ? Math.round(oiUsd) : null, markPrice: mark, ok: rate != null };
  } catch { return dead("hyperliquid", 1); }
}

export async function getDerivatives(symbol: string) {
  const sym = symbol.toUpperCase().replace(/USDT$|-USDT-SWAP$|PERP$/i, "").trim();
  if (!sym) throw new Error("Missing symbol (e.g. BTC, ETH, SOL).");
  return cached("derivatives:" + sym, 20000, () => computeDerivatives(sym));
}

async function computeDerivatives(sym: string) {
  const [venues, retail] = await Promise.all([
    Promise.all([binance(sym), bybit(sym), okx(sym), hyperliquid(sym)]),
    longShort(sym),
  ]);
  const ok = venues.filter((v) => v.ok && v.fundingAprPct != null);

  let spread: any = null;
  if (ok.length >= 2) {
    const sorted = [...ok].sort((a, b) => (a.fundingAprPct! - b.fundingAprPct!));
    const low = sorted[0], high = sorted[sorted.length - 1];
    spread = {
      lowestExchange: low.exchange, lowestAprPct: low.fundingAprPct,
      highestExchange: high.exchange, highestAprPct: high.fundingAprPct,
      spreadPct: Number((high.fundingAprPct! - low.fundingAprPct!).toFixed(2)),
    };
  }

  const avgApr = ok.length ? Number((ok.reduce((s, v) => s + (v.fundingAprPct || 0), 0) / ok.length).toFixed(2)) : null;
  let sentiment = "neutral";
  if (avgApr != null) {
    if (avgApr > 20) sentiment = "crowded_long";
    else if (avgApr < -20) sentiment = "crowded_short";
    else if (avgApr > 0) sentiment = "mild_long";
    else if (avgApr < 0) sentiment = "mild_short";
  }

  const totalOiUsd = ok.reduce((s, v) => s + (v.openInterestUsd || 0), 0);

  const signals: string[] = [];
  if (spread && Math.abs(spread.spreadPct) >= 30) {
    signals.push("Large funding spread (~" + spread.spreadPct + "% APR) between " + spread.highestExchange + " and " + spread.lowestExchange + ": potential funding-arbitrage / venue divergence.");
  }
  if (sentiment === "crowded_long") signals.push("High positive funding across venues: market heavily long, elevated long-squeeze risk.");
  if (sentiment === "crowded_short") signals.push("Strongly negative funding: market heavily short, short-squeeze risk.");

  // Tin hieu long/short tai khoan (retail): doi chieu voi funding de phat hien lech.
  if (retail && retail.longShortRatio != null) {
    if (retail.longShortRatio >= 2) signals.push("Retail accounts heavily long (L/S ratio " + retail.longShortRatio + "): crowded long positioning.");
    else if (retail.longShortRatio <= 0.5) signals.push("Retail accounts heavily short (L/S ratio " + retail.longShortRatio + "): crowded short positioning.");
    // lech giua funding va retail: funding am (smart money short) nhung retail long manh = canh bao
    if (avgApr != null && avgApr < 0 && retail.longShortRatio >= 1.5) {
      signals.push("Divergence: funding negative while retail is long -- retail leaning against funding.");
    }
  }

  if (!signals.length) signals.push("No extreme funding or cross-venue divergence detected.");

  return {
    type: "derivatives",
    symbol: sym,
    venues: venues.map((v) => ({
      exchange: v.exchange,
      ok: v.ok,
      fundingRatePeriod: v.fundingRate,
      fundingIntervalHours: v.fundingIntervalHours,
      fundingAprPct: v.fundingAprPct,
      openInterestUsd: v.openInterestUsd,
      markPrice: v.markPrice,
    })),
    aggregate: {
      venuesReporting: ok.length,
      avgFundingAprPct: avgApr,
      totalOpenInterestUsd: totalOiUsd || null,
      sentiment,
    },
    retailPositioning: retail,
    fundingSpread: spread,
    signals,
    note: "Funding normalized to annualized APR for cross-venue comparison (CEX charge ~8h, Hyperliquid hourly). Open interest in USD (Binance/Hyperliquid derived from contracts x mark price; Bybit/OKX report USD directly). retailPositioning is Binance global long/short ACCOUNT ratio (>1 = more accounts long). Sentiment/signals are heuristic, not financial advice. Data from public exchange APIs; a venue or signal is omitted if unavailable.",
  };
}
