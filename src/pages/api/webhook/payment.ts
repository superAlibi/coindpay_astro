import type { APIRoute } from "astro";
import { createHmacSignature } from "../../../server/coindpay";
import { getKv } from "../../../server/kv";
import { env } from "../../../tools";

const API_SECRET_ENV = "COINDPAY_API_SECRET";

function jsonResponse(
  data: { ok: boolean; message: string },
  status: number
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export const POST: APIRoute = async ({ request }) => {
  const secretKey = env(API_SECRET_ENV);

  if (!secretKey || typeof secretKey !== "string" || !secretKey.trim()) {
    return jsonResponse(
      { ok: false, message: "Missing CoindPay API SECRET in env" },
      500
    );
  }

  const signatureHeader = request.headers.get("x-signature");
  if (!signatureHeader) {
    return jsonResponse({ ok: false, message: "Invalid signature" }, 400);
  }

  const rawBody = await request.text();
  const expectedSig = createHmacSignature(secretKey, rawBody);

  if (signatureHeader !== expectedSig) {
    return jsonResponse({ ok: false, message: "Invalid signature" }, 401);
  }

  let data: { id?: string; rampStatus?: string;[k: string]: unknown };
  try {
    data = JSON.parse(rawBody) as typeof data;
  } catch {
    return jsonResponse({ ok: false, message: "Invalid payment order" }, 502);
  }

  if (!data?.id) {
    return jsonResponse({ ok: false, message: "Invalid payment order" }, 502);
  }

  console.log(
    `CoindPay payment ${data.id}-${data.rampStatus ?? "?"} callback:`,
    data
  );

  try {
    const kv = await getKv();
    const key = ["payment_order", data.id];
    await kv.set(key, { ...data, receivedAt: new Date().toISOString() });
  } catch (e) {
    console.error("Failed to persist payment webhook to KV:", e);
  }

  return jsonResponse({ ok: true, message: "OK" }, 200);
};
