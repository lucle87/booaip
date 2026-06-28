import { NextRequest } from "next/server";
import { makePaidPost, readBody, jsonError, jsonOk } from "@/lib/x402route";
import { getSupply } from "@/lib/endpoints/supply";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function handler(req: NextRequest) {
  const body = await readBody(req);
  const token = (body?.token || body?.address || "").toString().trim();
  const chain = (body?.chain || "").toString().trim();
  if (!token || !chain) return jsonError("Missing 'token' and 'chain' (eth, bnb, base).");
  try {
    return jsonOk(await getSupply(token, chain));
  } catch (e: any) {
    return jsonError("Supply lookup failed: " + (e?.message || "unknown"), 502);
  }
}

export const POST = makePaidPost("supply", handler, {
  description: "ERC-20 token name, symbol, decimals and total supply via on-chain read. Body: { token, chain }.",
  input: { token: "0x...", chain: "base" },
  inputSchema: { properties: { token: { type: "string" }, chain: { type: "string", description: "eth, bnb, base." } }, required: ["token", "chain"] },
  outputExample: { found: true, symbol: "USDC", decimals: 6, totalSupply: "1000000" },
  outputSchema: { properties: { found: { type: "boolean" }, symbol: { type: "string" }, decimals: { type: "number" }, totalSupply: { type: "string" } } },
});
