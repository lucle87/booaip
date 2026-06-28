// openapi.json tu sinh tu CATALOG. Them endpoint = openapi tu cap nhat.
import { CATALOG } from "@/lib/catalog";
import { BASE_URL, PAY_TO, X402_NETWORK, priceUsdFor } from "@/lib/x402config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const paths: any = {};
  for (const item of CATALOG) {
    const priceUsd = priceUsdFor(item.key);
    paths[item.path] = {
      post: {
        operationId: item.key,
        summary: item.title,
        description: item.description,
        "x-payment-info": {
          x402Version: 2,
          price: { mode: "fixed", amount: priceUsd, currency: "USD" },
          protocols: ["x402"],
          network: X402_NETWORK,
          asset: "USDC",
          payTo: PAY_TO,
        },
        requestBody: {
          required: true,
          content: { "application/json": { schema: item.inputSchema } },
        },
        responses: {
          "200": {
            description: item.title + " result.",
            content: { "application/json": { schema: item.outputSchema } },
          },
          "400": { description: "Bad Request - missing/invalid input." },
          "402": { description: "Payment Required (x402, USDC on Base)." },
        },
      },
    };
  }

  const spec = {
    openapi: "3.1.0",
    info: {
      title: "booAIP - Crypto data API for AI agents",
      version: "1.0.0",
      description:
        "Pay-per-call crypto/web3 ground-truth data for AI agents. Token prices, DeFi TVL, market sentiment and more. USDC via x402 on Base. No API key, no signup.",
      contact: { name: "booAIP", email: process.env.CONTACT_EMAIL || "vanlucpdu@gmail.com", url: BASE_URL },
    },
    servers: [{ url: BASE_URL }],
    "x-docs": { llmsTxt: BASE_URL + "/llms.txt" },
    "x-guidance":
      "booAIP provides crypto/web3 ground-truth data for AI agents. Pick the endpoint that matches the task: /api/snapshot for a one-call market + supply + safety read on a token (best for pre-trade screening); /api/price for price only; /api/tvl, /api/yields, /api/stablecoins, /api/chains for DeFi metrics; /api/feargreed for sentiment; /api/gas, /api/ens, /api/supply for on-chain reads; /api/sanctions for OFAC wallet screening. Each endpoint is a separate paid POST; pay per call via x402 (USDC on Base). For yields, pass safeOnly:true to drop suspicious pools.",
    x402Version: 2,
    "x-discovery": { ownershipProofs: [PAY_TO] },
    paths,
  };

  return new Response(JSON.stringify(spec, null, 2), {
    headers: { "content-type": "application/json" },
  });
}
