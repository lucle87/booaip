// Wallet sanctions screen: doi chieu dia chi voi danh sach OFAC SDN crypto.
// Nguon: mirror cong dong cua 0xB10C (cap nhat tu OFAC), file text dia chi ETH/EVM.
import { isAddress } from "viem";

const LIST_URL =
  "https://raw.githubusercontent.com/0xB10C/ofac-sanctioned-digital-currency-addresses/lists/sanctioned_addresses_ETH.txt";
const TTL = 60 * 60 * 1000; // cache 1 gio

let cache: { at: number; set: Set<string> } | null = null;

async function loadList(): Promise<Set<string>> {
  if (cache && Date.now() - cache.at < TTL) return cache.set;
  const res = await fetch(LIST_URL, {
    headers: { "User-Agent": "booAIP/1.0" },
    cache: "no-store",
  });
  if (!res.ok) throw new Error("OFAC list HTTP " + res.status);
  const text = await res.text();
  const set = new Set(
    text.split(/\r?\n/).map((l) => l.trim().toLowerCase()).filter(Boolean)
  );
  cache = { at: Date.now(), set };
  return set;
}

export async function screenAddress(address: string) {
  if (!isAddress(address)) throw new Error("Invalid EVM address.");
  const set = await loadList();
  const hit = set.has(address.toLowerCase());
  return {
    address,
    verdict: hit ? "BLOCK" : "PASS",
    sanctioned: hit,
    listSize: set.size,
    source: "OFAC SDN crypto addresses (community mirror: 0xB10C, refreshed hourly)",
    note: "This is a mirror of OFAC SDN crypto addresses, not legal advice. For compliance decisions, verify against official OFAC sources.",
  };
}
