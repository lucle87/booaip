import { NextRequest } from "next/server";
import { makePaidPost, readBody, jsonError, jsonOk } from "@/lib/x402route";
import { getStablecoin } from "@/lib/endpoints/stablecoins";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function handler(req: NextRequest) {
  const body = await readBody(req);
  const symbol = body?.symbol ? body.symbol.toString().trim() : undefined;
  try {
    return jsonOk(await getStablecoin(symbol));
  } catch (e: any) {
    return jsonError("Stablecoin lookup failed: " + (e?.message || "unknown"), 502);
  }
}

export const POST = makePaidPost("stablecoins", handler, {
  description: "Stablecoin circulating supply, price and peg deviation (DefiLlama). Body: { symbol? }.",
  input: { symbol: "USDT" },
  inputSchema: { properties: { symbol: { type: "string", description: "Stablecoin symbol (e.g. USDT). Omit for top 10." } }, required: [] },
  outputExample: { found: true, symbol: "USDT", circulatingUsd: 100000000000, pegDeviationPct: 0.01 },
  outputSchema: { properties: { found: { type: "boolean" }, symbol: { type: "string" }, circulatingUsd: { type: "number" }, pegDeviationPct: { type: "number" } } },
});
