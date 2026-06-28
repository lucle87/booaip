import { NextRequest } from "next/server";
import { makePaidPost, readBody, jsonError, jsonOk } from "@/lib/x402route";
import { resolveEns } from "@/lib/endpoints/ens";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function handler(req: NextRequest) {
  const body = await readBody(req);
  const query = (body?.query || body?.name || body?.address || "").toString().trim();
  if (!query) return jsonError("Missing 'query' (ENS name xxx.eth or 0x address).");
  try {
    return jsonOk(await resolveEns(query));
  } catch (e: any) {
    return jsonError("ENS resolve failed: " + (e?.message || "unknown"), 502);
  }
}

export const POST = makePaidPost("ens", handler, {
  description: "Resolve ENS name to address or reverse-resolve address to name (Ethereum mainnet). Body: { query }.",
  input: { query: "vitalik.eth" },
  inputSchema: { properties: { query: { type: "string", description: "ENS name (xxx.eth) or address (0x...)." } }, required: ["query"] },
  outputExample: { found: true, name: "vitalik.eth", address: "0x..." },
  outputSchema: { properties: { found: { type: "boolean" }, name: { type: "string" }, address: { type: "string" } } },
});
