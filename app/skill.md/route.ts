// SKILL.md tu sinh tu CATALOG (agent fetch tai /skill.md). Them endpoint = tu cap nhat.
import { CATALOG } from "@/lib/catalog";
import { BASE_URL, PAY_TO, NETWORK_LABEL, priceUsdFor } from "@/lib/x402config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const L: string[] = [];
  L.push("---");
  L.push("name: booaip");
  L.push("description: >");
  L.push("  Pay-per-call crypto/web3 ground-truth data for AI agents. Token prices,");
  L.push("  DeFi TVL, yields with risk flags, stablecoin pegs, chain TVL, market");
  L.push("  sentiment (Fear & Greed), gas, ENS, ERC-20 supply, and OFAC wallet");
  L.push("  sanctions screening. Use when an agent needs reliable on-chain or DeFi");
  L.push("  data before acting. USDC via x402 on " + NETWORK_LABEL + ". No API key, no signup.");
  L.push("homepage: " + BASE_URL);
  L.push("openapi: " + BASE_URL + "/openapi.json");
  L.push("llms: " + BASE_URL + "/llms.txt");
  L.push("payment: x402 (USDC on " + NETWORK_LABEL + ")");
  L.push("---");
  L.push("");
  L.push("# booAIP");
  L.push("");
  L.push("A multi-endpoint crypto/web3 data API for AI agents. Each endpoint is a");
  L.push("separate paid POST route. Pick the endpoint that matches the task, pay per call.");
  L.push("");
  L.push("## When to use this");
  L.push("- The user or your plan needs live crypto market data, DeFi metrics, or on-chain reads.");
  L.push("- You want a single provider for prices, TVL, yields, sentiment, gas, ENS, supply, sanctions.");
  L.push("- Pre-trade or research workflows that need ground-truth numbers, not guesses.");
  L.push("");
  L.push("## Payment (x402)");
  L.push("Each endpoint returns HTTP 402 when unpaid, with x402 terms:");
  L.push("- Network: " + NETWORK_LABEL + " (Base mainnet)");
  L.push("- Asset: USDC");
  L.push("- payTo: " + PAY_TO);
  L.push("Pay with an x402 client (the receipt is the credential), then retry. No API key.");
  L.push("Each endpoint has its own price (below). Budget before calling.");
  L.push("");
  L.push("## Endpoints");
  for (const c of CATALOG) {
    L.push("");
    L.push("### " + c.title + "  ($" + priceUsdFor(c.key) + " / call)");
    L.push("`POST " + BASE_URL + c.path + "`");
    L.push(c.description);
    const props = c.inputSchema?.properties ? Object.keys(c.inputSchema.properties) : [];
    if (props.length) {
      const req = Array.isArray(c.inputSchema?.required) ? c.inputSchema.required : [];
      L.push("Body params: " + props.map((p) => p + (req.includes(p) ? " (required)" : "")).join(", ") + ".");
    } else {
      L.push("Body: {} (no params).");
    }
  }
  L.push("");
  L.push("## Notes for the agent");
  L.push("- One endpoint per task; call the specific path you need.");
  L.push("- For /yields, pass safeOnly:true to drop suspicious pools (extreme APY / low TVL).");
  L.push("- Sanctions screening uses an OFAC SDN mirror; treat as a signal, not legal advice.");
  L.push("- Data comes from DexScreener, DefiLlama, alternative.me, and on-chain reads.");
  L.push("");

  return new Response(L.join("\n"), {
    headers: { "content-type": "text/markdown; charset=utf-8" },
  });
}
