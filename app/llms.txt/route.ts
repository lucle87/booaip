// llms.txt tu sinh tu CATALOG.
import { CATALOG } from "@/lib/catalog";
import { BASE_URL, PAY_TO, NETWORK_LABEL, priceUsdFor } from "@/lib/x402config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const lines: string[] = [];
  lines.push("# booAIP - Crypto data API for AI agents");
  lines.push("");
  lines.push(
    "Pay-per-call crypto/web3 ground-truth data. USDC via x402 on " + NETWORK_LABEL + ". No API key, no signup."
  );
  lines.push("Each endpoint is a separate POST route with its own price. Unpaid requests return HTTP 402.");
  lines.push("");
  lines.push("## Endpoints");
  for (const item of CATALOG) {
    lines.push("");
    lines.push("### " + item.title + "  (" + priceUsdFor(item.key) + " USD/call)");
    lines.push("POST " + BASE_URL + item.path);
    lines.push(item.description);
  }
  lines.push("");
  lines.push("## Payment");
  lines.push(
    "Unpaid requests return HTTP 402 with an x402 payment requirement (USDC on Base), recipient " +
      PAY_TO +
      ". Pay with an x402 client and retry."
  );
  lines.push("");

  return new Response(lines.join("\n"), {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
