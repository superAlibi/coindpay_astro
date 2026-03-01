# 部署说明

## 当前：Deno Deploy（SSR）

项目已配置为使用 `@deno/astro-adapter`，适合部署到 [Deno Deploy](https://deno.com/deploy)。

### 本地预览构建结果

```bash
pnpm install   # 若尚未安装依赖（含 @deno/astro-adapter）
pnpm run build
pnpm run preview   # 使用 Deno 运行 dist/server/entry.mjs
```

需已安装 [Deno](https://deno.com/)。

### 通过 GitHub Actions 部署

1. 在 [Deno Deploy](https://dash.deno.com/) 用 GitHub 登录，新建项目，选择 **GitHub Action** 模式并关联本仓库。
2. 编辑 `.github/workflows/deploy-deno.yml`，将 `project: coindpay` 改成你在 Deno Deploy 里创建的项目名。
3. 推送到 `main` 分支即可自动构建并部署（使用 OIDC 鉴权，无需配置 Token）。

### 本地用 deployctl 部署

安装 [deployctl](https://docs.deno.com/deploy/manual/deployctl/) 后：

```bash
pnpm run build
pnpm run deploy:deno   # 或: cd dist && deployctl deploy --project=你的项目名 ./server/entry.mjs
```

---

## 备选：改用 Cloudflare

若 Deno Deploy 不满足需求，可改为部署到 **Cloudflare Pages / Workers**：

### 1. 安装 Cloudflare 适配器

```bash
pnpm add @astrojs/cloudflare
```

### 2. 修改 `astro.config.mjs`

将 Deno 的 adapter 换成 Cloudflare：

```js
// 删除或注释掉
// import deno from '@deno/astro-adapter';

import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  output: 'server',
  adapter: cloudflare(),   // 替换 adapter: deno(),
  site: 'https://coindpay.luchador.dev',
  vite: { plugins: [tailwindcss()] }
});
```

### 3. 添加 Wrangler 配置

在项目根目录创建 `wrangler.jsonc`（或 `wrangler.toml`）：

```jsonc
{
  "name": "coindpay-astro",
  "compatibility_date": "2025-03-01",
  "assets": {
    "directory": "./dist",
    "binding": "ASSETS"
  }
}
```

### 4. 构建与部署

```bash
pnpm run build
npx wrangler deploy
```

Cloudflare 官方文档：[Deploy Astro to Cloudflare](https://docs.astro.build/en/guides/deploy/cloudflare/)。

---

**注意**：API 或服务端代码若使用了 Node 专有 API（如 `node:crypto`），在 Deno 或 Cloudflare Workers 下可能需要改用各自运行时的等价 API。
