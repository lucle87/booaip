// Gas oracle doc on-chain qua viem (RPC free/public).
import { formatGwei } from "viem";
import { clientFor } from "@/lib/evm";

export async function getGas(chain: string) {
  const client = clientFor(chain);
  const gasPrice = await client.getGasPrice();
  let fees: any = null;
  try {
    fees = await client.estimateFeesPerGas();
  } catch {
    fees = null;
  }
  return {
    chain,
    gasPriceGwei: Number(Number(formatGwei(gasPrice)).toFixed(3)),
    maxFeePerGasGwei: fees?.maxFeePerGas
      ? Number(Number(formatGwei(fees.maxFeePerGas)).toFixed(3))
      : null,
    maxPriorityFeePerGasGwei: fees?.maxPriorityFeePerGas
      ? Number(Number(formatGwei(fees.maxPriorityFeePerGas)).toFixed(3))
      : null,
  };
}
