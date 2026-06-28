import { NextRequest } from "next/server";
import { makePaidPost, readBody, jsonError, jsonOk } from "@/lib/x402route";
import { getChain } from "@/lib/endpoints/chains";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function handler(req: NextRequest) {
  const body = await readBody(req);
  const chain = body?.chain ? body.chain.toString().trim() : undefined;
  try {
    return jsonOk(await getChain(chain));
  } catch (e: any) {
    return jsonError("Chain lookup failed: " + (e?.message || "unknown"), 502);
  }
}

export const POST = makePaidPost("chains", handler, {
  description: "Chain TVL, rank and dominance (DefiLlama). Body: { chain? }.",
  input: { chain: "base" },
  inputSchema: { properties: { chain: { type: "string", description: "Chain name (e.g. base). Omit for top 10." } }, required: [] },
  outputExample: { found: true, chain: "Base", tvlUsd: 5000000000, rank: 6, dominancePct: 3.2 },
  outputSchema: { properties: { found: { type: "boolean" }, chain: { type: "string" }, tvlUsd: { type: "number" }, rank: { type: "number" }, dominancePct: { type: "number" } } },
});
