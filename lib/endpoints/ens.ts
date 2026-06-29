// ENS resolver doc on-chain (ENS song tren Ethereum mainnet).
import { createPublicClient, http, isAddress } from "viem";
import { mainnet } from "viem/chains";
import { normalize } from "viem/ens";
import { rpcFor } from "@/lib/x402config";

function mainnetClient() {
  const rpc = rpcFor("eth");
  return createPublicClient({ chain: mainnet, transport: http(rpc, { timeout: 6000, retryCount: 1, retryDelay: 300 }) });
}

export async function resolveEns(query: string) {
  const q = query.trim();
  const client = mainnetClient();

  if (q.toLowerCase().endsWith(".eth")) {
    try {
      const name = normalize(q);
      const address = await client.getEnsAddress({ name });
      return {
        query: q,
        type: "name",
        name: q,
        address: address || null,
        found: !!address,
      };
    } catch (e: any) {
      return {
        query: q,
        type: "name",
        name: q,
        address: null,
        found: false,
        error: "ENS lookup error: " + (e?.shortMessage || e?.message || "unknown"),
      };
    }
  }

  if (isAddress(q)) {
    try {
      const name = await client.getEnsName({ address: q as `0x${string}` });
      return { query: q, type: "address", address: q, name: name || null, found: !!name };
    } catch (e: any) {
      return {
        query: q,
        type: "address",
        address: q,
        name: null,
        found: false,
        error: "Reverse ENS error: " + (e?.shortMessage || e?.message || "unknown"),
      };
    }
  }

  return { query: q, found: false, message: "Provide an ENS name (xxx.eth) or an EVM address (0x...)." };
}
