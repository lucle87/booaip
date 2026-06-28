import { NextRequest } from "next/server";
import { makePaidPost, readBody, jsonError, jsonOk } from "@/lib/x402route";
import { getSnapshot } from "@/lib/endpoints/snapshot";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function handler(req: NextRequest) {
  const body = await readBody(req);
  const token = (body?.token || body?.address || "").toString().trim();
  const chain = (body?.chain || "").toString().trim();
  if (!token || !chain) return jsonError("Missing 'token' and 'chain' (eth, bnb, base).");
  try {
    return jsonOk(await getSnapshot(token, chain));
  } catch (e: any) {
    return jsonError("Snapshot failed: " + (e?.message || "unknown"), 502);
  }
}

export const POST = makePaidPost("snapshot", handler, {
  description: "One-call token snapshot: market (price, liquidity, volume), on-chain supply, and GoPlus safety flags with a quick OK/CAUTION/DANGER read. Replaces chaining price + supply + safety. Body: { token, chain }.",
  input: { token: "0x...", chain: "base" },
  inputSchema: {
    properties: {
      token: { type: "string", description: "Token contract address." },
      chain: { type: "string", description: "eth, bnb, base." },
    },
    required: ["token", "chain"],
  },
  outputExample: { token: "0x...", safetyVerdict: "OK", market: { priceUsd: 0.01 }, safety: { honeypot: false } },
  outputSchema: {
    properties: {
      safetyVerdict: { type: "string", enum: ["OK", "CAUTION", "DANGER", "UNKNOWN"] },
      riskFlags: { type: "array", items: { type: "string" } },
      market: { type: "object" },
      supply: { type: "object" },
      safety: { type: "object" },
    },
  },
});
