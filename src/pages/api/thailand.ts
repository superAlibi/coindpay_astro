import type { APIRoute } from "astro";
import {
  createCollectingOrder,
  CreateCollectingOrderParamsSchema,
  type CreateCollectingOrderParamsValidated,

} from "../../server/thailand";
import { randomUUID } from "node:crypto";
import { getKv } from "../../server/kv";

function jsonResponse(
  data: { ok: boolean; message: string },
  status: number
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/** 从 FormData 取字符串，空则返回 '' */
function getString(form: FormData, name: string): string {
  const v = form.get(name);
  return typeof v === "string" ? v : "";
}

export const POST: APIRoute = async ({ request, site, rewrite }) => {
  if (request.headers.get("Content-Type")?.includes("application/json")) {
    const body = await request.json();
    const { merchantUniqueOrderId, playerSign, amount, notifyUrl, remark, ...ops } = body;
    const response = await createCollectingOrder({
      merchantUniqueOrderId,
      playerSign,
      amount,
      notifyUrl,
      remark,
      ...ops,
    });
    return Response.redirect(response.data.url, 302);
  }

  if (
    request.headers.get("Content-Type")?.includes("application/x-www-form-urlencoded") ||
    request.headers.get("Content-Type")?.includes("multipart/form-data")
  ) {
    const form = await request.formData();
    const notifyUrl = new URL(site!)
    notifyUrl.pathname = "/api/webhook/thailand";

    const params: CreateCollectingOrderParamsValidated = {
      merchantUniqueOrderId: randomUUID(),
      playerSign: getString(form, "playerSign") ?? 'no-callback',
      amount: getString(form, "amount"),
      notifyUrl: notifyUrl.toString(),

      remark: getString(form, "remark"),
      playerMobile: getString(form, "playerMobile"),
      bankNameCreate: getString(form, "bankNameCreate"),
      bankNumberCreate: getString(form, "bankNumberCreate"),
      nameCreate: getString(form, "nameCreate"),
    };
    const parsed = CreateCollectingOrderParamsSchema.safeParse(params);
    if (!parsed.success) {
      return jsonResponse(
        {
          ok: false,
          message: parsed.error.issues.map((i) => i.message).join(", "),
        },
        400
      );
    }
    const response = await createCollectingOrder(parsed.data as CreateCollectingOrderParamsValidated);
    const kv = await getKv();
    if (response.code !== '0') {
      return jsonResponse(
        {
          ok: false,
          message: response.msg,
        },
        400
      );
    }
    await kv.set(["thailand", 'orders', response.data.merchantUniqueOrderId, 'create'], {
      ...response.data,
      receivedAt: new Date().toISOString(),
    });
    return Response.redirect(response.data.url, 302);
  }

  return jsonResponse({ ok: false, message: "Unsupported content type" }, 400);
};