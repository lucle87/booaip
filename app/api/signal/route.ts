import { NextRequest } from "next/server";
import { makePaidPost, readBody, jsonError, jsonOk } from "@/lib/x402route";
import { getSignal } from "@/lib/endpoints/signal";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function handler(req: NextRequest) {
  const body = await readBody(req);
  const symbol = (body?.symbol || body?.coin || body?.token || "").toString().trim();
  if (!symbol) return jsonError("Missing 'symbol' (e.g. BTC, ETH, SOL).");
  try {
    return jsonOk(await getSignal(symbol));
  } catch (e: any) {
    return jsonError("Signal lookup failed: " + (e?.message || "unknown"), 502);
  }
}

export const POST = makePaidPost("signal", handler, {
  description: "Decision-support trade signal for a coin: a transparent composite of technicals (RSI, moving averages, trend, volatility from 1h klines), derivatives positioning (funding, OI, long/short), and market sentiment (fear & greed). Returns a bias (bullish/bearish/neutral lean), a score, and a factor-by-factor breakdown with reasoning, plus risk flags. Heuristic, not financial advice. Body: { symbol } (e.g. BTC).",
  input: { symbol: "BTC" },
  inputSchema: { properties: { symbol: { type: "string", description: "Coin symbol, e.g. BTC, ETH, SOL." } }, required: ["symbol"] },
  outputExample: { symbol: "BTC", signal: { bias: "neutral", score: 8 } },
  outputSchema: {
    properties: {
      technicals: { type: "object" },
      derivatives: { type: "object" },
      marketSentiment: { type: "object" },
      signal: { type: "object" },
      riskFlags: { type: "array", items: { type: "string" } },
    },
  },
});
