// Crypto Fear & Greed Index tu alternative.me (free, khong can key).
// Nguon: https://api.alternative.me/fng/?limit=2

const UA = "booAIP/1.0 (+https://booaip.vercel.app)";
import { fetchJson } from "@/lib/http";
import { cached } from "@/lib/cache";

export async function getFearGreed() {
  const url = "https://api.alternative.me/fng/?limit=2";
  const data: any = await cached("feargreed", 60000, () => fetchJson(url, { timeoutMs: 5000, headers: { "User-Agent": UA } }));
  const arr: any[] = Array.isArray(data?.data) ? data.data : [];
  if (!arr.length) throw new Error("No data");

  const cur = arr[0];
  const prev = arr[1];
  const value = Number(cur?.value);
  const prevValue = prev ? Number(prev.value) : null;

  return {
    value,
    classification: cur?.value_classification || null,
    timestamp: cur?.timestamp ? Number(cur.timestamp) : null,
    previousValue: prevValue,
    change1d: prevValue != null ? value - prevValue : null,
    scale: "0 = Extreme Fear, 100 = Extreme Greed",
  };
}
