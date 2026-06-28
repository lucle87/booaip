import { NextRequest } from "next/server";
import { makePaidPost, readBody, jsonError, jsonOk } from "@/lib/x402route";
import { screenAddress } from "@/lib/endpoints/sanctions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function handler(req: NextRequest) {
  const body = await readBody(req);
  const address = (body?.address || body?.wallet || "").toString().trim();
  if (!address) return jsonError("Missing 'address' (EVM wallet 0x...).");
  try {
    return jsonOk(await screenAddress(address));
  } catch (e: any) {
    return jsonError("Sanctions screen failed: " + (e?.message || "unknown"), 502);
  }
}

export const POST = makePaidPost("sanctions", handler, {
  description: "Screen an EVM wallet against OFAC SDN crypto address list (PASS/BLOCK). Body: { address }.",
  input: { address: "0x..." },
  inputSchema: { properties: { address: { type: "string", description: "EVM wallet address." } }, required: ["address"] },
  outputExample: { address: "0x...", verdict: "PASS", sanctioned: false },
  outputSchema: { properties: { address: { type: "string" }, verdict: { type: "string", enum: ["PASS", "BLOCK"] }, sanctioned: { type: "boolean" } } },
});
