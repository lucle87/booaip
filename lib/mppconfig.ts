// Cau hinh thanh toan MPP/Tempo cho booAIP (rail thu hai, song song x402 tren Base).
// Sao chep dung tu Tempo Pulse da chay duoc: USDC.e tren Tempo, charge truoc validate sau.
export type NetworkName = "mainnet" | "testnet";

export const TEMPO_NETWORK: NetworkName =
  (process.env.TEMPO_NETWORK as NetworkName) || "mainnet";

export const TEMPO_TESTNET = TEMPO_NETWORK === "testnet";

// Token nhan tien tren Tempo: USDC.e (da kiem chung agent dung duoc). KHONG dung USDT0.
export const PAY_TOKEN = (process.env.PAY_TOKEN ||
  "0x20c000000000000000000000b9537d11c60e8b50") as `0x${string}`;

// Vi nhan tien tren Tempo (dia chi EVM cua ban dung duoc tren Tempo).
export const MPP_RECIPIENT = (process.env.MPP_RECIPIENT ||
  process.env.RECIPIENT_ADDRESS ||
  process.env.PAY_TO ||
  "0x0000000000000000000000000000000000000000") as `0x${string}`;

export const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

export const REALM_HOST = (() => {
  try {
    return new URL(BASE_URL).host;
  } catch {
    return "localhost:3000";
  }
})();

export const MPP_SECRET_KEY =
  process.env.MPP_SECRET_KEY || "dev-secret-change-me-in-production-please-32b";
