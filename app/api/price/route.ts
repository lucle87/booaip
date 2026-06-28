import { NextRequest } from "next/server";
import { makePaidPost, readBody, jsonError, jsonOk } from "@/lib/x402route";
import { getTokenPrice } from "@/lib/endpoints/price";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function handler(req: NextRequest) {
  const body = await readBody(req);
  const token = (body?.token || body?.address || "").toString().trim();
  const chain = body?.chain ? body.chain.toString().trim() : undefined;
  if (!token) return jsonError("Missing 'token' (contract address).");
  try {
    return jsonOk(await getTokenPrice(token, chain));
  } catch (e: any) {
    return jsonError("Price lookup failed: " + (e?.message || "unknown"), 502);
  }
}

export const POST = makePaidPost("price", handler, {
  description: "Token price, liquidity, 24h volume and FDV from DEX pairs (DexScreener).",
  input: { token: "0x...", chain: "base" },
  inputSchema: {
    properties: {
      token: { type: "string", description: "Token contract address." },
      chain: { type: "string", description: "Optional: eth, bnb, base." },
    },
    required: ["token"],
  },
  outputExample: { found: true, symbol: "X", priceUsd: 0.01, liquidityUsd: 100000 },
  outputSchema: {
    properties: {
      found: { type: "boolean" },
      symbol: { type: "string" },
      priceUsd: { type: "number" },
      liquidityUsd: { type: "number" },
      volume24hUsd: { type: "number" },
      fdvUsd: { type: "number" },
    },
  },
});
