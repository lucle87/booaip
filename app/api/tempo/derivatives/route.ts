// Rail MPP/Tempo cho derivatives (song song voi /api/derivatives tren x402/Base).
// Cung logic getDerivatives, chi khac cong thanh toan la MPP tren Tempo.
import { makeMppPost } from "@/lib/mpproute";
import { getDerivatives } from "@/lib/endpoints/derivatives";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = makeMppPost("0.01", async (body) => {
  const symbol = (body?.symbol || body?.coin || body?.token || "").toString().trim();
  if (!symbol) throw new Error("Missing 'symbol' (e.g. BTC, ETH, SOL).");
  return getDerivatives(symbol);
});
