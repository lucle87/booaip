// Cau hinh x402 V2 server dung chung cho moi route (withX402).

import { x402ResourceServer } from "@x402/core/server";
import { HTTPFacilitatorClient } from "@x402/core/server";
import { registerExactEvmScheme } from "@x402/evm/exact/server";
import { bazaarResourceServerExtension } from "@x402/extensions/bazaar";
import { facilitator as cdpFacilitator } from "@coinbase/x402";
import { IS_MAINNET, FACILITATOR_URL } from "@/lib/x402config";

const facilitatorClient = IS_MAINNET
  ? new HTTPFacilitatorClient(cdpFacilitator as any)
  : new HTTPFacilitatorClient({ url: FACILITATOR_URL });

export const server = new x402ResourceServer(facilitatorClient);
registerExactEvmScheme(server);
(server as any).registerExtension?.(bazaarResourceServerExtension);
