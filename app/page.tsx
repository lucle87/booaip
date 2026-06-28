import { CATALOG } from "@/lib/catalog";
import { BASE_URL, priceUsdFor } from "@/lib/x402config";

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <main style={{ maxWidth: 820, margin: "0 auto", padding: "40px 20px" }}>
      <h1 style={{ fontSize: 28 }}>booAIP</h1>
      <p style={{ color: "#9aa4af" }}>
        Pay-per-call crypto/web3 ground-truth data for AI agents. USDC via x402 on Base. No API key, no signup.
      </p>
      <p style={{ color: "#9aa4af" }}>
        Docs: <a href="/llms.txt" style={{ color: "#5db0ff" }}>/llms.txt</a> &middot;{" "}
        <a href="/openapi.json" style={{ color: "#5db0ff" }}>/openapi.json</a>
      </p>
      <h2 style={{ fontSize: 18, marginTop: 32 }}>Endpoints</h2>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
        <thead>
          <tr style={{ textAlign: "left", color: "#9aa4af" }}>
            <th style={{ padding: "8px 4px" }}>Endpoint</th>
            <th style={{ padding: "8px 4px" }}>Path</th>
            <th style={{ padding: "8px 4px" }}>Price</th>
          </tr>
        </thead>
        <tbody>
          {CATALOG.map((c) => (
            <tr key={c.key} style={{ borderTop: "1px solid #1c2127" }}>
              <td style={{ padding: "8px 4px" }}>{c.title}</td>
              <td style={{ padding: "8px 4px", color: "#9aa4af" }}>POST {c.path}</td>
              <td style={{ padding: "8px 4px" }}>${priceUsdFor(c.key)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p style={{ color: "#5a636d", marginTop: 32, fontSize: 12 }}>
        Base URL: {BASE_URL}
      </p>
    </main>
  );
}
