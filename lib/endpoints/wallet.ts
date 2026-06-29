// Wallet profile (Nhom A): doc on-chain thuan + OFAC, KHONG can indexer.
// Lay duoc: balance native, tx count (nonce), la contract hay khong, sanctioned.
// KHONG lay duoc tu RPC thuan: tuoi vi (first tx), lich su DeFi/bridge/NFT,
// activity theo thoi gian -> can indexer (Etherscan/Alchemy/Dune). Da ghi ro o note.
import { formatEther, isAddress } from "viem";
import { clientFor } from "@/lib/evm";
import { screenAddress } from "@/lib/endpoints/sanctions";

const WHALE_NATIVE: Record<string, number> = { eth: 100, base: 100, bnb: 1000 };
const NATIVE_SYMBOL: Record<string, string> = { eth: "ETH", base: "ETH", bnb: "BNB" };

function activityLevel(nonce: number): string {
  if (nonce === 0) return "none";
  if (nonce < 10) return "low";
  if (nonce < 100) return "medium";
  return "high";
}

export async function getWallet(wallet: string, chain: string) {
  if (!isAddress(wallet)) throw new Error("Invalid EVM wallet address.");
  const c = chain.toLowerCase();
  const pc = clientFor(c);
  const sym = NATIVE_SYMBOL[c] || "native";

  const [balR, nonceR, codeR, ofacR] = await Promise.allSettled([
    pc.getBalance({ address: wallet as `0x${string}` }),
    pc.getTransactionCount({ address: wallet as `0x${string}` }),
    pc.getBytecode({ address: wallet as `0x${string}` }),
    screenAddress(wallet),
  ]);

  const balWei = balR.status === "fulfilled" ? balR.value : 0n;
  const nativeBalance = Number(formatEther(balWei));
  const txCount = nonceR.status === "fulfilled" ? nonceR.value : 0;
  const code = codeR.status === "fulfilled" ? codeR.value : undefined;
  const isContract = !!(code && code !== "0x");
  const sanctioned = ofacR.status === "fulfilled" ? ofacR.value.sanctioned : false;

  const whaleThreshold = WHALE_NATIVE[c] ?? 100;
  const isWhale = nativeBalance >= whaleThreshold;
  const level = activityLevel(txCount);

  // Score 0-100: 100 = established/clean, 0 = sanctioned. Heuristic, khong phai bao dam.
  let score: number;
  const flags: string[] = [];
  if (sanctioned) {
    score = 0;
    flags.push("ofac_sanctioned");
  } else {
    score = 50;
    if (txCount >= 100) score += 30;
    else if (txCount >= 10) score += 20;
    else if (txCount >= 1) score += 10;
    if (nativeBalance > 0) score += 10;
    score = Math.min(100, score);
    if (txCount === 0 && nativeBalance === 0) flags.push("empty_unused");
    if (isContract) flags.push("smart_contract");
    if (isWhale) flags.push("whale");
    if (level === "low") flags.push("low_activity");
  }

  return {
    wallet,
    chain: c,
    isContract,
    nativeBalance: Number(nativeBalance.toFixed(6)),
    nativeSymbol: sym,
    txCount, // so giao dich da gui (nonce), proxy do hoat dong
    activityLevel: level,
    isWhale,
    sanctioned,
    sanctionsVerdict: sanctioned ? "BLOCK" : "PASS",
    walletScore: score, // 0-100 heuristic: cao = co ve da thiet lap/sach
    flags,
    note: "On-chain snapshot from direct RPC reads (native balance, tx count, contract status) plus OFAC screening. NOT a full wallet analysis: wallet age, DeFi/bridge/NFT history, and time-based activity require an indexer and are not included. walletScore is a heuristic, not a safety guarantee.",
  };
}
