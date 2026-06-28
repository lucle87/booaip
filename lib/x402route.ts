// Helper dung chung de boc mot handler bang x402 + preview bypass.
// Moi endpoint chi can goi makePaidPost(key, path, handler, discovery).

import { NextRequest, NextResponse } from "next/server";
import { withX402 } from "@x402/next";
import { declareDiscoveryExtension } from "@x402/extensions/bazaar";
import { server } from "@/lib/x402server";
import { PAY_TO, X402_NETWORK, priceFor } from "@/lib/x402config";

type Handler = (req: NextRequest) => Promise<any>;

type Discovery = {
  description: string;
  input?: any;
  inputSchema?: any;
  outputExample?: any;
  outputSchema?: any;
  bodyType?: "json";
};

export function makePaidPost(key: string, handler: Handler, d: Discovery) {
  const paid = withX402(
    handler as any,
    {
      accepts: [
        {
          scheme: "exact",
          price: priceFor(key),
          network: X402_NETWORK,
          payTo: PAY_TO,
        },
      ],
      description: d.description,
      mimeType: "application/json",
      extensions: {
        ...declareDiscoveryExtension({
          bodyType: d.bodyType || "json",
          input: d.input,
          inputSchema: d.inputSchema,
          output: { example: d.outputExample, schema: d.outputSchema },
        }),
      },
    } as any,
    server
  );

  return async function POST(req: NextRequest, ctx: any) {
    const preview = req.nextUrl.searchParams.get("preview");
    if (preview && process.env.PREVIEW_KEY && preview === process.env.PREVIEW_KEY) {
      return handler(req);
    }
    return (paid as any)(req, ctx);
  };
}

// Doc body JSON an toan.
export async function readBody(req: NextRequest): Promise<any> {
  try {
    return await req.json();
  } catch {
    return {};
  }
}

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function jsonOk(data: any) {
  return NextResponse.json(data);
}
