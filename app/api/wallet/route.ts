import { NextRequest } from "next/server";
import { makePaidPost, readBody, jsonError, jsonOk } from "@/lib/x402route";
import { getWallet } from "@/lib/endpoints/wallet";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function handler(req: NextRequest) {
  const body = await readBody(req);
  const wallet = (body?.wallet || body?.address || "").toString().trim();
  const chain = (body?.chain || "").toString().trim();
  if (!wallet || !chain) return jsonError("Missing 'wallet' and 'chain' (eth, bnb, base).");
  try {
    return jsonOk(await getWallet(wallet, chain));
  } catch (e: any) {
    return jsonError("Wallet lookup failed: " + (e?.message || "unknown"), 502);
  }
}

export const POST = makePaidPost("wallet", handler, {
  description: "On-chain wallet profile: native balance, tx count (activity), contract status, OFAC sanctions screen, whale flag, and a heuristic wallet score. Body: { wallet, chain } (eth, bnb, base). RPC-only snapshot; no DeFi/bridge history.",
  input: { wallet: "0x...", chain: "eth" },
  inputSchema: {
    properties: {
      wallet: { type: "string", description: "EVM wallet address." },
      chain: { type: "string", description: "eth, bnb, base." },
    },
    required: ["wallet", "chain"],
  },
  outputExample: { wallet: "0x...", walletScore: 90, isWhale: false, sanctioned: false, txCount: 1234 },
  outputSchema: {
    properties: {
      walletScore: { type: "number" },
      isWhale: { type: "boolean" },
      sanctioned: { type: "boolean" },
      txCount: { type: "number" },
      activityLevel: { type: "string" },
      flags: { type: "array", items: { type: "string" } },
    },
  },
});
