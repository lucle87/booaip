import { NextRequest } from "next/server";
import { makePaidPost, readBody, jsonError, jsonOk } from "@/lib/x402route";
import { getGas } from "@/lib/endpoints/gas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function handler(req: NextRequest) {
  const body = await readBody(req);
  const chain = (body?.chain || "base").toString().trim();
  try {
    return jsonOk(await getGas(chain));
  } catch (e: any) {
    return jsonError("Gas lookup failed: " + (e?.message || "unknown"), 502);
  }
}

export const POST = makePaidPost("gas", handler, {
  description: "Current gas price (gwei) on an EVM chain via on-chain read. Body: { chain }.",
  input: { chain: "base" },
  inputSchema: { properties: { chain: { type: "string", description: "eth, bnb, or base." } }, required: [] },
  outputExample: { chain: "base", gasPriceGwei: 0.05 },
  outputSchema: { properties: { chain: { type: "string" }, gasPriceGwei: { type: "number" }, maxFeePerGasGwei: { type: "number" } } },
});
