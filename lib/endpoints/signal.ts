// Trade SIGNAL & analysis cho mot coin: tong hop technicals (klines Binance) +
// derivatives (funding/OI/long-short) + market sentiment (fear&greed) thanh mot
// ban doc co cau truc, MINH BACH tung yeu to dong gop. Day la DECISION-SUPPORT:
// agent doc tin hieu roi TU quyet dinh + tu thuc thi lenh bang key cua no.
// KHONG thuc thi lenh, KHONG cam tien/key, KHONG phai loi khuyen dau tu.
//
// Triet ly chat luong: khong tra mot con so hop den. Tra diem tong hop KEM
// breakdown tung factor (reading + contribution + why) de agent/nguoi kiem chung.

import { fetchJson, fetchJsonSafe } from "@/lib/http";
import { getDerivatives } from "@/lib/endpoints/derivatives";
import { getFearGreed } from "@/lib/endpoints/feargreed";
import { cached } from "@/lib/cache";

type Kline = number[]; // [openTime, open, high, low, close, volume, ...]

function sma(values: number[], period: number): number | null {
  if (values.length < period) return null;
  const slice = values.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / period;
}

function rsi(closes: number[], period = 14): number | null {
  if (closes.length < period + 1) return null;
  let gains = 0;
  let losses = 0;
  // seed
  for (let i = closes.length - period; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }
  const avgGain = gains / period;
  const avgLoss = losses / period;
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return Number((100 - 100 / (1 + rs)).toFixed(1));
}

function pct(a: number, b: number): number {
  if (!b) return 0;
  return Number((((a - b) / b) * 100).toFixed(2));
}

// stdev cua return theo % (bien dong gan day)
function volatilityPct(closes: number[], lookback = 24): number | null {
  if (closes.length < lookback + 1) return null;
  const rets: number[] = [];
  for (let i = closes.length - lookback; i < closes.length; i++) {
    rets.push((closes[i] - closes[i - 1]) / closes[i - 1]);
  }
  const mean = rets.reduce((a, b) => a + b, 0) / rets.length;
  const variance = rets.reduce((a, b) => a + (b - mean) ** 2, 0) / rets.length;
  return Number((Math.sqrt(variance) * 100).toFixed(2));
}

async function getKlines(symbol: string): Promise<Kline[] | null> {
  const s = symbol.toUpperCase() + "USDT";
  // 1h, 200 nen (du cho SMA50 + ~7 ngay)
  const url = "https://fapi.binance.com/fapi/v1/klines?symbol=" + s + "&interval=1h&limit=200";
  const raw = await fetchJsonSafe<any[]>(url, { timeoutMs: 5000 });
  if (!Array.isArray(raw) || !raw.length) return null;
  // Binance tra mang cac mang; close o vi tri 4 (chuoi). Chuyen so.
  return raw.map((k) => k.map((x: any) => (typeof x === "string" ? Number(x) : x)));
}

type Factor = { name: string; reading: string; contribution: number; why: string };

export async function getSignal(symbol: string) {
  const sym = symbol.toUpperCase().replace(/USDT$|-USDT-SWAP$|PERP$/i, "").trim();
  if (!sym) throw new Error("Missing symbol (e.g. BTC, ETH, SOL).");

  return cached("signal:" + sym, 30000, async () => {
    // chay song song: klines, derivatives, fear&greed
    const [klines, derivatives, fg] = await Promise.all([
      getKlines(sym),
      getDerivatives(sym).catch(() => null),
      getFearGreed().catch(() => null),
    ]);

    // ---- Technicals tu klines ----
    let technicals: any = null;
    let closes: number[] = [];
    if (klines && klines.length) {
      closes = klines.map((k) => k[4]).filter((n) => Number.isFinite(n));
      const last = closes[closes.length - 1];
      const sma20 = sma(closes, 20);
      const sma50 = sma(closes, 50);
      const close24ago = closes.length > 24 ? closes[closes.length - 25] : null;
      const close7dago = closes.length > 168 ? closes[closes.length - 169] : null;
      let trend = "sideways";
      if (sma20 != null && sma50 != null) {
        if (last > sma20 && sma20 > sma50) trend = "up";
        else if (last < sma20 && sma20 < sma50) trend = "down";
      }
      technicals = {
        price: last,
        rsi14: rsi(closes),
        sma20,
        sma50,
        priceVsSma20Pct: sma20 != null ? pct(last, sma20) : null,
        priceVsSma50Pct: sma50 != null ? pct(last, sma50) : null,
        trend,
        volatilityPct: volatilityPct(closes),
        change24hPct: close24ago != null ? pct(last, close24ago) : null,
        change7dPct: close7dago != null ? pct(last, close7dago) : null,
      };
    }

    // condense derivatives
    const der = derivatives
      ? {
          avgFundingAprPct: derivatives.aggregate?.avgFundingAprPct ?? null,
          sentiment: derivatives.aggregate?.sentiment ?? null,
          totalOpenInterestUsd: derivatives.aggregate?.totalOpenInterestUsd ?? null,
          fundingSpreadPct: derivatives.fundingSpread?.spreadPct ?? null,
          retailLongShortRatio: derivatives.retailPositioning?.longShortRatio ?? null,
        }
      : null;

    const sentiment = fg
      ? { fearGreed: fg.value ?? null, classification: fg.classification ?? null }
      : null;

    // ---- Composite signal MINH BACH ----
    const factors: Factor[] = [];

    // 1. Trend (price vs SMA20/50)
    if (technicals?.trend) {
      if (technicals.trend === "up")
        factors.push({ name: "trend", reading: "price above SMA20 > SMA50", contribution: +25, why: "Uptrend structure." });
      else if (technicals.trend === "down")
        factors.push({ name: "trend", reading: "price below SMA20 < SMA50", contribution: -25, why: "Downtrend structure." });
      else
        factors.push({ name: "trend", reading: "no clear MA alignment", contribution: 0, why: "Sideways / mixed MAs." });
    }

    // 2. RSI (mean-reversion risk)
    if (technicals?.rsi14 != null) {
      const r = technicals.rsi14;
      if (r >= 70) factors.push({ name: "rsi", reading: "RSI " + r + " (overbought)", contribution: -15, why: "Overbought: pullback risk." });
      else if (r <= 30) factors.push({ name: "rsi", reading: "RSI " + r + " (oversold)", contribution: +15, why: "Oversold: bounce potential." });
      else if (r >= 55) factors.push({ name: "rsi", reading: "RSI " + r + " (firm)", contribution: +8, why: "Momentum positive, not extreme." });
      else if (r <= 45) factors.push({ name: "rsi", reading: "RSI " + r + " (soft)", contribution: -8, why: "Momentum negative, not extreme." });
      else factors.push({ name: "rsi", reading: "RSI " + r + " (neutral)", contribution: 0, why: "No momentum edge." });
    }

    // 3. Funding (contrarian khi cuc doan)
    if (der?.avgFundingAprPct != null) {
      const f = der.avgFundingAprPct;
      if (f > 30) factors.push({ name: "funding", reading: "funding " + f + "% APR (very high)", contribution: -15, why: "Crowded long: elevated long-squeeze risk." });
      else if (f < -15) factors.push({ name: "funding", reading: "funding " + f + "% APR (negative)", contribution: +12, why: "Crowded short: short-squeeze potential." });
      else if (f > 0) factors.push({ name: "funding", reading: "funding " + f + "% APR (mild positive)", contribution: +4, why: "Mild long bias, not extreme." });
      else factors.push({ name: "funding", reading: "funding " + f + "% APR", contribution: 0, why: "Neutral funding." });
    }

    // 4. Retail long/short (contrarian khi cuc doan)
    if (der?.retailLongShortRatio != null) {
      const ls = der.retailLongShortRatio;
      if (ls >= 2.5) factors.push({ name: "retail_positioning", reading: "L/S " + ls + " (very long)", contribution: -10, why: "Retail heavily long: contrarian caution." });
      else if (ls <= 0.6) factors.push({ name: "retail_positioning", reading: "L/S " + ls + " (very short)", contribution: +10, why: "Retail heavily short: contrarian upside." });
      else factors.push({ name: "retail_positioning", reading: "L/S " + ls, contribution: 0, why: "Balanced retail positioning." });
    }

    // 5. Fear & Greed (contrarian khi cuc doan)
    if (sentiment?.fearGreed != null) {
      const v = sentiment.fearGreed;
      if (v >= 80) factors.push({ name: "market_sentiment", reading: "F&G " + v + " (extreme greed)", contribution: -12, why: "Extreme greed: contrarian caution." });
      else if (v <= 20) factors.push({ name: "market_sentiment", reading: "F&G " + v + " (extreme fear)", contribution: +12, why: "Extreme fear: contrarian opportunity." });
      else factors.push({ name: "market_sentiment", reading: "F&G " + v, contribution: 0, why: "Neutral sentiment." });
    }

    // 6. Momentum 24h (xac nhan, trong so nho)
    if (technicals?.change24hPct != null) {
      const c = technicals.change24hPct;
      if (c >= 3) factors.push({ name: "momentum_24h", reading: "+" + c + "% 24h", contribution: +6, why: "Positive short-term momentum." });
      else if (c <= -3) factors.push({ name: "momentum_24h", reading: c + "% 24h", contribution: -6, why: "Negative short-term momentum." });
      else factors.push({ name: "momentum_24h", reading: c + "% 24h", contribution: 0, why: "Flat short-term." });
    }

    const rawScore = factors.reduce((s, f) => s + f.contribution, 0);
    const score = Math.max(-100, Math.min(100, rawScore));
    let bias = "neutral";
    if (score >= 25) bias = "bullish_lean";
    else if (score <= -25) bias = "bearish_lean";

    // risk flags
    const riskFlags: string[] = [];
    if (technicals?.volatilityPct != null && technicals.volatilityPct > 3)
      riskFlags.push("High recent volatility (" + technicals.volatilityPct + "% hourly stdev): wider stops / smaller size warranted.");
    if (der?.avgFundingAprPct != null && der.avgFundingAprPct > 30)
      riskFlags.push("Very high funding: holding longs is expensive and squeeze-prone.");
    if (technicals?.rsi14 != null && (technicals.rsi14 >= 75 || technicals.rsi14 <= 25))
      riskFlags.push("RSI at an extreme: mean-reversion risk against the trend.");
    if (!technicals) riskFlags.push("No technical data (klines unavailable): signal based on derivatives/sentiment only.");
    if (!der) riskFlags.push("No derivatives data: signal based on technicals/sentiment only.");

    const dataUsed: string[] = [];
    if (technicals) dataUsed.push("technicals(1h klines)");
    if (der) dataUsed.push("derivatives(funding/OI/long-short)");
    if (sentiment) dataUsed.push("fear&greed");

    return {
      type: "signal",
      symbol: sym,
      timeframe: "1h",
      price: technicals?.price ?? null,
      technicals,
      derivatives: der,
      marketSentiment: sentiment,
      signal: {
        bias, // bullish_lean | bearish_lean | neutral
        score, // -100..100, composite of the factors below
        factors, // each factor: reading + contribution + why (transparent)
      },
      riskFlags,
      dataUsed,
      note:
        "Decision-support only. This is a heuristic, transparent composite of public technical, derivatives, and sentiment data, shown with its factor breakdown so you can verify the reasoning. It is NOT a prediction and NOT financial advice. Score and bias are mechanical readings, not a recommendation to buy or sell. A signal is missing-data-aware: dataUsed shows which sources contributed. Execute your own decisions with your own risk management.",
    };
  });
}
