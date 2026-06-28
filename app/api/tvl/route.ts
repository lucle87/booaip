import { NextRequest } from "next/server";
import { makePaidPost, readBody, jsonError, jsonOk } from "@/lib/x402route";
import { getProtocolTvl } from "@/lib/endpoints/tvl";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function handler(req: NextRequest) {
  const body = await readBody(req);
  const protocol = (body?.protocol || body?.slug || "").toString().trim();
  if (!protocol) return jsonError("Missing 'protocol' (DefiLlama slug, e.g. 'aave').");
  try {
    return jsonOk(await getProtocolTvl(protocol));
  } catch (e: any) {
    return jsonError("TVL lookup failed: " + (e?.message || "unknown"), 502);
  }
}

export const POST = makePaidPost("tvl", handler, {
  description: "DeFi protocol TVL, chains and 1d/7d change (DefiLlama).",
  input: { protocol: "aave" },
  inputSchema: {
    properties: {
      protocol: { type: "string", description: "DefiLlama protocol slug (e.g. aave, uniswap, lido)." },
    },
    required: ["protocol"],
  },
  outputExample: { found: true, protocol: "Aave", tvlUsd: 1000000000, change7dPct: 2.5 },
  outputSchema: {
    properties: {
      found: { type: "boolean" },
      protocol: { type: "string" },
      tvlUsd: { type: "number" },
      chains: { type: "array", items: { type: "string" } },
      change1dPct: { type: "number" },
      change7dPct: { type: "number" },
    },
  },
});
