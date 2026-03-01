// @ts-check
import { defineConfig } from 'astro/config';
import deno from '@deno/astro-adapter';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
// 部署到 Deno Deploy。若改用 Cloudflare，可执行: pnpm add @astrojs/cloudflare && 将 adapter 改为 cloudflare()
export default defineConfig({
  output: 'server',
  adapter: deno(),
  site: 'https://coindpay.luchador.dev',
  vite: {
    plugins: [tailwindcss()]
  }
});