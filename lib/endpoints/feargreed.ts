// Crypto Fear & Greed Index tu alternative.me (free, khong can key).
// Nguon: https://api.alternative.me/fng/?limit=2

const UA = "booAIP/1.0 (+https://booaip.vercel.app)";

export async function getFearGreed() {
  const url = "https://api.alternative.me/fng/?limit=2";
  const res = await fetch(url, { headers: { "User-Agent": UA }, cache: "no-store" });
  if (!res.ok) throw new Error("alternative.me HTTP " + res.status);
  const data: any = await res.json();
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
