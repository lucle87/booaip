import { NextRequest } from "next/server";
import { makePaidPost, jsonError, jsonOk } from "@/lib/x402route";
import { getFearGreed } from "@/lib/endpoints/feargreed";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function handler(_req: NextRequest) {
  try {
    return jsonOk(await getFearGreed());
  } catch (e: any) {
    return jsonError("Fear & Greed lookup failed: " + (e?.message || "unknown"), 502);
  }
}

export const POST = makePaidPost("feargreed", handler, {
  description: "Current crypto Fear & Greed Index with 1-day change (alternative.me).",
  input: {},
  inputSchema: { properties: {}, required: [] },
  outputExample: { value: 55, classification: "Greed", change1d: 3 },
  outputSchema: {
    properties: {
      value: { type: "number" },
      classification: { type: "string" },
      change1d: { type: "number" },
    },
  },
});
