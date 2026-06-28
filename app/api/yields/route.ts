import { NextRequest } from "next/server";
import { makePaidPost, readBody, jsonError, jsonOk } from "@/lib/x402route";
import { getYields } from "@/lib/endpoints/yields";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function handler(req: NextRequest) {
  const body = await readBody(req);
  const symbol = body?.symbol ? body.symbol.toString().trim() : undefined;
  const chain = body?.chain ? body.chain.toString().trim() : undefined;
  const limit = body?.limit ? Number(body.limit) : 5;
  const safeOnly = body?.safeOnly === true || body?.safeOnly === "true";
  try {
    return jsonOk(await getYields(symbol, chain, limit, safeOnly));
  } catch (e: any) {
    return jsonError("Yields lookup failed: " + (e?.message || "unknown"), 502);
  }
}

export const POST = makePaidPost("yields", handler, {
  description: "Top APY yield pools by token symbol and chain, with risk flags (DefiLlama). Body: { symbol?, chain?, limit?, safeOnly? }.",
  input: { symbol: "USDC", chain: "base", limit: 5, safeOnly: true },
  inputSchema: {
    properties: {
      symbol: { type: "string", description: "Token symbol to search (e.g. USDC)." },
      chain: { type: "string", description: "Optional chain filter." },
      limit: { type: "number", description: "Max pools (1-20)." },
      safeOnly: { type: "boolean", description: "Drop suspicious pools (extreme APY / low TVL)." },
    },
    required: [],
  },
  outputExample: { count: 5, suspiciousInResult: 0, pools: [{ project: "aave-v3", apyPct: 4.2, tvlUsd: 1000000, riskFlags: [], suspicious: false }] },
  outputSchema: { properties: { count: { type: "number" }, pools: { type: "array", items: { type: "object" } } } },
});
