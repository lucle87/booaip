import { NextRequest } from "next/server";
import { makePaidPost, readBody, jsonError, jsonOk } from "@/lib/x402route";
import { getDerivatives } from "@/lib/endpoints/derivatives";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function handler(req: NextRequest) {
  const body = await readBody(req);
  const symbol = (body?.symbol || body?.coin || body?.token || "").toString().trim();
  if (!symbol) return jsonError("Missing 'symbol' (e.g. BTC, ETH, SOL).");
  try {
    return jsonOk(await getDerivatives(symbol));
  } catch (e: any) {
    return jsonError("Derivatives lookup failed: " + (e?.message || "unknown"), 502);
  }
}

export const POST = makePaidPost("derivatives", handler, {
  description: "Multi-exchange perp funding + open interest for a coin across Binance, Bybit, OKX, and Hyperliquid. Funding normalized to annualized APR, cross-venue spread, OI in USD, and a funding-based sentiment read. Body: { symbol } (e.g. BTC).",
  input: { symbol: "BTC" },
  inputSchema: { properties: { symbol: { type: "string", description: "Coin symbol, e.g. BTC, ETH, SOL." } }, required: ["symbol"] },
  outputExample: { symbol: "BTC", aggregate: { avgFundingAprPct: 8.5, sentiment: "mild_long" }, fundingSpread: { spreadPct: 12.3 } },
  outputSchema: {
    properties: {
      venues: { type: "array" },
      aggregate: { type: "object" },
      fundingSpread: { type: "object" },
      signals: { type: "array", items: { type: "string" } },
    },
  },
});
