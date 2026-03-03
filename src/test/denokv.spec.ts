import { describe, it, expect, afterEach } from 'vitest';
import { getKv } from '../server/kv';
import { env } from '../tools';

const TEST_KEY = ['test', 'connectivity', crypto.randomUUID()];

describe('Deno KV 连接性', () => {
  let kv: Awaited<ReturnType<typeof getKv>>;

  afterEach(async () => {
    if (kv) {
      kv?.close();
    }
  });

  it('get env DENO_KV_DB_ID', () => {
    const DENO_KV_DB_ID = env('DENO_KV_DB_ID');
    expect(DENO_KV_DB_ID).toBeDefined();
    expect(DENO_KV_DB_ID).toBeTruthy();
  });

  it('get env DENO_KV_ACCESS_TOKEN', () => {
    const DENO_KV_ACCESS_TOKEN = env('DENO_KV_ACCESS_TOKEN');
    expect(DENO_KV_ACCESS_TOKEN).toBeDefined();
    expect(DENO_KV_ACCESS_TOKEN).toBeTruthy();
  });

  it('能成功获取 remote db KV 实例', async () => {
    kv = await getKv(env('DENO_KV_DB_ID'));
    expect(kv).toBeDefined();
  });

  it('能写入并读取数据', async () => {
    kv = await getKv(env('DENO_KV_DB_ID'));
    const value = { ping: 'pong', at: new Date().toISOString() };
    await kv.set(TEST_KEY, value);
    const entry = await kv.get(TEST_KEY);
    expect(entry.value).toEqual(value);
    expect(entry.key).toEqual(TEST_KEY);
  });

  it('能删除数据', async () => {
    kv = await getKv(env('DENO_KV_DB_ID'));
    await kv.set(TEST_KEY, { temp: true });
    await kv.delete(TEST_KEY);
    const entry = await kv.get(TEST_KEY);
    expect(entry.value).toBeNull();
  });
});
