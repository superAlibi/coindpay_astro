

import { openKv } from '@deno/kv'
import { env } from '../tools';


/**
 * 获取 KV 实例（单例）。在 Deno 运行时使用原生 Deno.openKv()，在 Node 下使用 @deno/kv。
 */
export async function getKv(ID?: string) {
  const accessToken = env('DENO_KV_ACCESS_TOKEN');
  if (!accessToken) {
    throw new Error('DENO_KV_ACCESS_TOKEN is not set');
  }
  if (ID) {
    return await openKv(`https://api.deno.com/databases/${ID}/connect`, { accessToken })
  }
  return await openKv()
}
