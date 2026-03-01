import { defineMiddleware } from "astro:middleware";

/**
 * 同一路由多处理器：
 * - GET  / → 由 index.astro 返回 HTML 页面
 * - POST / → 内部重写到 /api/root-post，由该端点处理
 */
export const onRequest = defineMiddleware((context, next) => {
  const { request, url } = context;
  if (request.method === "POST" && url.pathname === "/") {
    return next("/api/root-post");
  }
  return next();
});
