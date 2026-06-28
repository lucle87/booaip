// Cau hinh x402 V2 dung chung cho moi endpoint cua booAIP.
// Moi endpoint co the co gia rieng qua bien PRICE_<KEY> (vd PRICE_PRICE, PRICE_TVL).

export type X402Caip2 = "eip155:8453" | "eip155:84532";

const RAW = (process.env.X402_NETWORK || "base").toLowerCase().trim();
export const X402_NETWORK: X402Caip2 =
  RAW === "base-sepolia" || RAW === "eip155:84532" ? "eip155:84532" : "eip155:8453";

export const IS_MAINNET = X402_NETWORK === "eip155:8453";
export const NETWORK_LABEL = IS_MAINNET ? "base" : "base-sepolia";

export const PAY_TO = (process.env.PAY_TO ||
  process.env.RECIPIENT_ADDRESS ||
  "0x0000000000000000000000000000000000000000") as `0x${string}`;

export const FACILITATOR_URL =
  process.env.FACILITATOR_URL || "https://x402.org/facilitator";

export const BASE_URL = (process.env.BASE_URL || "http://localhost:3000").replace(
  /\/+$/,
  ""
);

export const CONTACT_EMAIL = process.env.CONTACT_EMAIL || "vanlucpdu@gmail.com";

// Gia mac dinh moi endpoint (USD, khong dau $). Env PRICE_<KEY> ghi de duoc.
const DEFAULT_PRICES: Record<string, string> = {
  price: "0.01",
  tvl: "0.01",
  feargreed: "0.005",
  yields: "0.01",
  stablecoins: "0.01",
  chains: "0.01",
  gas: "0.005",
  ens: "0.005",
  sanctions: "0.01",
  supply: "0.01",
};

// Next nuot dau $ trong .env (xem bai hoc base-rugcheck), nen chuan hoa lai.
function normalizePrice(raw: string): string {
  let p = (raw || "0.01").trim().replace(/^\$/, "");
  if (p.startsWith(".")) p = "0" + p;
  if (p === "" || p === "0") p = "0.01";
  return "$" + p;
}

// Tra gia dang "$0.01" cho mot endpoint.
export function priceFor(key: string): string {
  const env = process.env["PRICE_" + key.toUpperCase()];
  return normalizePrice(env || DEFAULT_PRICES[key] || "0.01");
}

// Gia dang so (khong $) de hien trong openapi.
export function priceUsdFor(key: string): string {
  return priceFor(key).replace("$", "");
}

// RPC doc on-chain (cho cac endpoint EVM). De trong = public RPC.
export function rpcFor(chain: string): string | undefined {
  const c = chain.toLowerCase();
  if (c === "eth" || c === "ethereum") return process.env.ETH_RPC_URL || undefined;
  if (c === "base") return process.env.BASE_RPC_URL || undefined;
  if (c === "bnb" || c === "bsc") return process.env.BNB_RPC_URL || undefined;
  return undefined;
}
