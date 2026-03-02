import type { APIRoute } from "astro";
import {
  verifyCollectingNotifySign,
  type CollectingNotifyPayload,
} from "../../../server/thailand";
import { getKv } from "../../../server/kv";
import { env } from "../../../tools";
const API_SECRET_ENV = "THAILAND_API_SECRET";

/** 确认收到回调需返回的字符串，文档要求 */
const SUCCESS_RESPONSE = "SUCCESS";

export const POST: APIRoute = async ({ request, clientAddress }) => {
  /**
   * 当不在白名单时，返回 403 错误
   * @see http://sandbox.bossbia.xyz:3031/
   */
  if (!env('THAILAND_WHITE_LIST_IP')?.includes(clientAddress)) {
    return new Response("IP not allowed", {
      status: 403,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
  const md5Key = env(API_SECRET_ENV);

  if (!md5Key || typeof md5Key !== "string" || !md5Key.trim()) {
    return new Response("Server config error", {
      status: 500,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  let payload: CollectingNotifyPayload;
  try {
    const body = await request.json();
    payload = body as CollectingNotifyPayload;
  } catch {
    return new Response("Invalid JSON", {
      status: 400,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  const required = [
    "merchantId",
    "merchantUniqueOrderId",
    "payOrderId",
    "amount",
    "transferAmount",
    "realAmount",
    "payOrderStatus",
    "remark",
    "finishTime",
    "sign",
  ] as const;
  for (const key of required) {
    if (payload[key] === undefined) {
      return new Response(`Missing field: ${key}`, {
        status: 400,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }
  }

  if (!verifyCollectingNotifySign(payload, md5Key)) {
    return new Response("Invalid sign", {
      status: 400,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  console.log(
    `Thailand collecting notify: ${payload.merchantUniqueOrderId} payOrderId=${payload.payOrderId} status=${payload.payOrderStatus}`
  );
  const kv = await getKv();
  await kv.set(["thailand", 'orders', payload.merchantUniqueOrderId, 'notify'], {
    ...payload,
    receivedAt: new Date().toISOString(),
  });

  return new Response(SUCCESS_RESPONSE, {
    status: 200,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
