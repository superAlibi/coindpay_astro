import type { APIRoute } from "astro";
import { randomUUID } from "node:crypto";
import {
  getEncodePayLink,
  CoindPayUrlParamsSchema,
  type CoindPayUrlParams,
} from "../../server/apis";

const PAYMENT_LINK_ENV = "COINDPAY_PAYMENT_LINK";
const BODY_STRIP_KEYS = ["payment_link", "link", "merchant_transaction_id"] as const;

/** 从 body 中移除服务端内置字段，只保留客户端可传参数 */
function stripBuiltinKeys(body: Record<string, unknown>): Record<string, unknown> {
  const out = { ...body };
  for (const key of BODY_STRIP_KEYS) delete out[key];
  return out;
}

/** 将 FormData/JSON 的原始值规范为 CoindPayUrlParams 可接受的类型 */
function normalizeBody(raw: Record<string, unknown>): Record<string, unknown> {
  const normalized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(raw)) {
    if (value === undefined || value === "") continue;

    if (key === "price") {
      const n = typeof value === "string" ? parseFloat(value) : Number(value);
      if (!Number.isNaN(n)) normalized[key] = n;
      continue;
    }
    if (key === "fix_payment_method" || key === "embed_widget") {
      normalized[key] =
        value === "true" || value === true || value === "1" || value === 1;
      continue;
    }
    if (key === "images") {
      if (typeof value === "string") {
        try {
          const parsed = JSON.parse(value) as unknown;
          if (Array.isArray(parsed)) normalized[key] = parsed;
        } catch {
          // 忽略无效 JSON
        }
      } else if (Array.isArray(value)) {
        normalized[key] = value;
      }
      continue;
    }

    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      normalized[key] = value;
    }
  }

  return normalized;
}

function jsonResponse(data: { ok: boolean; message: string; details?: string }, status: number) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export const POST: APIRoute = async ({ request }) => {
  let rawBody: Record<string, unknown>;

  const contentType = request.headers.get("Content-Type") ?? "";

  if (contentType.includes("application/json")) {
    const body = await request.json().catch(() => ({}));
    rawBody = typeof body === "object" && body !== null ? body : {};
  } else if (
    contentType.includes("multipart/form-data") ||
    contentType.includes("application/x-www-form-urlencoded")
  ) {
    const formData = await request.formData().catch(() => null);
    if (!formData) {
      return jsonResponse({ ok: false, message: "无法解析表单数据" }, 400);
    }
    rawBody = Object.fromEntries(formData.entries()) as Record<string, unknown>;
  } else {
    return jsonResponse({ ok: false, message: "Unsupported content type" }, 400);
  }

  const paymentLink = import.meta.env[PAYMENT_LINK_ENV] ?? process.env[PAYMENT_LINK_ENV];
  if (!paymentLink || typeof paymentLink !== "string" || !paymentLink.trim()) {
    return jsonResponse(
      { ok: false, message: "缺少支付链接", details: `请配置环境变量 ${PAYMENT_LINK_ENV}` },
      400
    );
  }

  const paramsOnly = stripBuiltinKeys(rawBody);
  const normalized = normalizeBody(paramsOnly);
  normalized.merchant_transaction_id = randomUUID();

  const parsed = CoindPayUrlParamsSchema.safeParse(normalized);
  if (!parsed.success) {
    const details = parsed.error.issues.map((i) => i.message).join("; ");
    return jsonResponse(
      { ok: false, message: "参数校验失败", details },
      400
    );
  }

  const queryData = parsed.data as CoindPayUrlParams;
  let targetUrl: string;

  try {
    targetUrl = await getEncodePayLink(paymentLink, queryData);
  } catch (err) {
    const message = err instanceof Error ? err.message : "生成支付链接失败";
    return jsonResponse({ ok: false, message }, 400);
  }

  return new Response(null, {
    status: 302,
    headers: { Location: targetUrl },
  });
};
