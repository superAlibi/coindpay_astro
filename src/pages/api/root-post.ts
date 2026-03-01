import type { APIRoute } from "astro";

/**
 * 根路径 POST 处理器（由中间件将 POST / 重写到此端点）。
 * 客户端只需 POST 到 /，无需知道此内部路径。
 */
export const POST: APIRoute = async ({ request }) => {
  if (request.headers.get("Content-Type")?.includes("application/json")) {
    const body = await request.json().catch(() => ({}));
    // 在此实现你的 POST 逻辑，例如表单处理、webhook 等
    return new Response(
      JSON.stringify({
        ok: true,
        message: "POST to root handled",
        received: body,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // 表单等 form-data 可在此处理
  const formData = await request.formData().catch(() => null);
  if (formData) {
    const entries = Object.fromEntries(formData.entries());
    return new Response(
      JSON.stringify({ ok: true, message: "Form received", data: entries }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  return new Response(
    JSON.stringify({ ok: false, message: "Unsupported content type" }),
    { status: 400, headers: { "Content-Type": "application/json" } }
  );
};
