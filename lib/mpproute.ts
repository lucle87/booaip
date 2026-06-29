// Helper boc mot handler logic bang cong MPP/Tempo (mppx), song song voi x402.
// Sao chep dung pattern Tempo Pulse: charge TRUOC (de agent probe thay 402 ngay),
// validate/doc du lieu SAU, ep host = REALM_HOST cho realm dung. Co preview bypass.
import { NextRequest } from "next/server";
import { Mppx, tempo } from "mppx/server";
import {
  TEMPO_TESTNET,
  PAY_TOKEN,
  MPP_RECIPIENT,
  MPP_SECRET_KEY,
  REALM_HOST,
} from "@/lib/mppconfig";

const mppx = Mppx.create({
  methods: [
    tempo({
      currency: PAY_TOKEN,
      recipient: MPP_RECIPIENT,
      testnet: TEMPO_TESTNET,
    }),
  ],
  secretKey: MPP_SECRET_KEY,
  realm: REALM_HOST,
});

// run: nhan body da parse, tra ve data (hoac throw -> 502). priceAmount: chuoi "0.01".
export function makeMppPost(priceAmount: string, run: (body: any) => Promise<any>) {
  async function readBody(request: NextRequest): Promise<any> {
    try {
      return await request.clone().json();
    } catch {
      return {};
    }
  }

  return async function POST(request: NextRequest) {
    const url = new URL(request.url);

    // ===== Preview (test, bo qua thanh toan) =====
    const previewKey = url.searchParams.get("preview");
    const PREVIEW_KEY = process.env.PREVIEW_KEY;
    if (PREVIEW_KEY && previewKey === PREVIEW_KEY) {
      const body = await readBody(request);
      try {
        return Response.json({ _preview: true, ...(await run(body)) });
      } catch (err: any) {
        return Response.json({ error: err?.message || "failed" }, { status: 502 });
      }
    }

    // ===== MPP: thu phi TRUOC (ep host = domain chinh de realm dung) =====
    let reqForMpp: Request = request;
    try {
      const fixedUrl = new URL(request.url);
      fixedUrl.host = REALM_HOST;
      fixedUrl.protocol = "https:";
      const headers = new Headers(request.headers);
      headers.set("host", REALM_HOST);
      headers.set("x-forwarded-host", REALM_HOST);
      reqForMpp = new Request(fixedUrl.toString(), {
        method: request.method,
        headers,
        body: await request.clone().arrayBuffer(),
      });
    } catch {
      reqForMpp = request;
    }

    const paid = await mppx.tempo.charge({
      amount: priceAmount,
      recipient: MPP_RECIPIENT,
    })(reqForMpp);

    // Chua tra -> challenge 402 ngay.
    if (paid.status === 402) {
      return paid.challenge;
    }

    // ===== Da tra -> doc body + chay logic =====
    const body = await readBody(request);
    try {
      return paid.withReceipt(Response.json(await run(body)));
    } catch (err: any) {
      return Response.json({ error: err?.message || "failed" }, { status: 502 });
    }
  };
}
