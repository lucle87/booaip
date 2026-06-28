// Danh muc endpoint cua booAIP. Them endpoint moi = them mot route + mot muc o day.
// openapi.json, llms.txt va trang chu deu tu sinh tu danh sach nay.
import { priceUsdFor } from "@/lib/x402config";

export type CatalogItem = {
  key: string;
  path: string;
  title: string;
  description: string;
  inputSchema: any;
  outputSchema: any;
};

export const CATALOG: CatalogItem[] = [
  {
    key: "price",
    path: "/api/price",
    title: "Token Price",
    description:
      "Token price, liquidity, 24h volume and FDV from DEX pairs (DexScreener). Body: { token, chain? }.",
    inputSchema: {
      type: "object",
      properties: {
        token: { type: "string", description: "Token contract address." },
        chain: { type: "string", description: "Optional: eth, bnb, base." },
      },
      required: ["token"],
    },
    outputSchema: {
      type: "object",
      properties: {
        found: { type: "boolean" },
        symbol: { type: "string" },
        priceUsd: { type: "number" },
        liquidityUsd: { type: "number" },
        volume24hUsd: { type: "number" },
        fdvUsd: { type: "number" },
      },
    },
  },
  {
    key: "tvl",
    path: "/api/tvl",
    title: "DeFi Protocol TVL",
    description:
      "DeFi protocol TVL, chains and 1d/7d change (DefiLlama). Body: { protocol } using the DefiLlama slug (e.g. aave, uniswap, lido).",
    inputSchema: {
      type: "object",
      properties: {
        protocol: { type: "string", description: "DefiLlama protocol slug." },
      },
      required: ["protocol"],
    },
    outputSchema: {
      type: "object",
      properties: {
        found: { type: "boolean" },
        protocol: { type: "string" },
        tvlUsd: { type: "number" },
        chains: { type: "array", items: { type: "string" } },
        change1dPct: { type: "number" },
        change7dPct: { type: "number" },
      },
    },
  },
  {
    key: "feargreed",
    path: "/api/feargreed",
    title: "Fear & Greed Index",
    description:
      "Current crypto Fear & Greed Index with 1-day change (alternative.me). Body: {} (no params).",
    inputSchema: { type: "object", properties: {}, required: [] },
    outputSchema: {
      type: "object",
      properties: {
        value: { type: "number" },
        classification: { type: "string" },
        change1d: { type: "number" },
      },
    },
  },
  {
    key: "yields",
    path: "/api/yields",
    title: "Yield Finder",
    description:
      "Top APY yield pools by token symbol and chain (DefiLlama). Body: { symbol?, chain?, limit? }.",
    inputSchema: {
      type: "object",
      properties: {
        symbol: { type: "string", description: "Token symbol (e.g. USDC)." },
        chain: { type: "string", description: "Optional chain filter." },
        limit: { type: "number", description: "Max pools 1-20." },
      },
      required: [],
    },
    outputSchema: {
      type: "object",
      properties: {
        count: { type: "number" },
        pools: { type: "array", items: { type: "object" } },
      },
    },
  },
  {
    key: "stablecoins",
    path: "/api/stablecoins",
    title: "Stablecoin Monitor",
    description:
      "Stablecoin circulating supply, price and peg deviation (DefiLlama). Body: { symbol? }.",
    inputSchema: {
      type: "object",
      properties: { symbol: { type: "string", description: "Stablecoin symbol (e.g. USDT). Omit for top 10." } },
      required: [],
    },
    outputSchema: {
      type: "object",
      properties: {
        found: { type: "boolean" },
        symbol: { type: "string" },
        circulatingUsd: { type: "number" },
        pegDeviationPct: { type: "number" },
      },
    },
  },
  {
    key: "chains",
    path: "/api/chains",
    title: "Chain Overview",
    description:
      "Chain TVL, rank and dominance (DefiLlama). Body: { chain? }.",
    inputSchema: {
      type: "object",
      properties: { chain: { type: "string", description: "Chain name (e.g. base). Omit for top 10." } },
      required: [],
    },
    outputSchema: {
      type: "object",
      properties: {
        found: { type: "boolean" },
        chain: { type: "string" },
        tvlUsd: { type: "number" },
        rank: { type: "number" },
        dominancePct: { type: "number" },
      },
    },
  },
  {
    key: "gas",
    path: "/api/gas",
    title: "Gas Oracle",
    description:
      "Current gas price (gwei) on an EVM chain via on-chain read. Body: { chain } (eth, bnb, base).",
    inputSchema: {
      type: "object",
      properties: { chain: { type: "string", description: "eth, bnb, or base." } },
      required: [],
    },
    outputSchema: {
      type: "object",
      properties: {
        chain: { type: "string" },
        gasPriceGwei: { type: "number" },
        maxFeePerGasGwei: { type: "number" },
      },
    },
  },
  {
    key: "ens",
    path: "/api/ens",
    title: "ENS Resolver",
    description:
      "Resolve ENS name to address or reverse-resolve address to name (Ethereum mainnet). Body: { query }.",
    inputSchema: {
      type: "object",
      properties: { query: { type: "string", description: "ENS name (xxx.eth) or address (0x...)." } },
      required: ["query"],
    },
    outputSchema: {
      type: "object",
      properties: {
        found: { type: "boolean" },
        name: { type: "string" },
        address: { type: "string" },
      },
    },
  },
  {
    key: "supply",
    path: "/api/supply",
    title: "Token Supply Info",
    description:
      "ERC-20 token name, symbol, decimals and total supply via on-chain read. Body: { token, chain }.",
    inputSchema: {
      type: "object",
      properties: {
        token: { type: "string", description: "Token contract address." },
        chain: { type: "string", description: "eth, bnb, base." },
      },
      required: ["token", "chain"],
    },
    outputSchema: {
      type: "object",
      properties: {
        found: { type: "boolean" },
        symbol: { type: "string" },
        decimals: { type: "number" },
        totalSupply: { type: "string" },
      },
    },
  },
  {
    key: "sanctions",
    path: "/api/sanctions",
    title: "Wallet Sanctions Screen",
    description:
      "Screen an EVM wallet against the OFAC SDN crypto address list (PASS/BLOCK). Body: { address }.",
    inputSchema: {
      type: "object",
      properties: { address: { type: "string", description: "EVM wallet address." } },
      required: ["address"],
    },
    outputSchema: {
      type: "object",
      properties: {
        address: { type: "string" },
        verdict: { type: "string", enum: ["PASS", "BLOCK"] },
        sanctioned: { type: "boolean" },
      },
    },
  },
  {
    key: "snapshot",
    path: "/api/snapshot",
    title: "Token Snapshot",
    description:
      "One-call token snapshot: market (price, liquidity, volume), on-chain supply, and GoPlus safety flags with a quick OK/CAUTION/DANGER read. Replaces chaining price + supply + safety into one call. Body: { token, chain } (eth, bnb, base).",
    inputSchema: {
      type: "object",
      properties: {
        token: { type: "string", description: "Token contract address." },
        chain: { type: "string", description: "eth, bnb, base." },
      },
      required: ["token", "chain"],
    },
    outputSchema: {
      type: "object",
      properties: {
        safetyVerdict: { type: "string", enum: ["OK", "CAUTION", "DANGER", "UNKNOWN"] },
        riskFlags: { type: "array", items: { type: "string" } },
        market: { type: "object" },
        supply: { type: "object" },
        safety: { type: "object" },
      },
    },
  },
];

export function priceOf(key: string): string {
  return priceUsdFor(key);
}
