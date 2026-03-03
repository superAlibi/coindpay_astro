

import { openKv } from '@deno/kv'
import type { Kv } from '@deno/kv';
import { env } from '../tools';

let kv: Kv;
/**
 * 获取 KV 实例。传 ID 时每次新建远程连接（便于测试里 close 后不污染单例）；不传 ID 时使用单例。
 */
export async function getKv(ID?: string) {
  const accessToken = env('DENO_KV_ACCESS_TOKEN');
  if (!accessToken) {
    throw new Error('DENO_KV_ACCESS_TOKEN is not set');
  }

  if (Deno) {
    // 环境支持deno, 则首先采用deno链接
    if (ID) {
      // 传入ID则新建远程连接
      return Deno.openKv(`https://api.deno.com/databases/${ID}/connect`,);
    }
    return Deno.openKv();
  }

  if (ID) {
    // https://api.deno.com/databases/<database-id>/connect
    return await openKv(`https://api.deno.com/databases/${ID}/connect`,
      {
        accessToken
      });
  }
  if (kv) {
    return kv;
  }
  return kv = await openKv();
}
