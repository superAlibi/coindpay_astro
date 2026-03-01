

import { openKv } from '@deno/kv'


/**
 * 获取 KV 实例（单例）。在 Deno 运行时使用原生 Deno.openKv()，在 Node 下使用 @deno/kv。
 */
export async function getKv() {
  /* const dev=import.meta.env.DEV
  if (dev) {
    return await openKv("https://api.deno.com/databases/2b187e61-3922-4192-ad60-739bc9e48633/connect")
  } */
  return await openKv()
}
