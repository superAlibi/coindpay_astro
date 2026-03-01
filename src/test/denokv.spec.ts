import { describe, it, expect, afterEach } from 'vitest';
import { getKv } from '../server/kv';

const TEST_KEY = ['test', 'connectivity', crypto.randomUUID()];

describe('Deno KV 连接性', () => {
  let kv: Awaited<ReturnType<typeof getKv>>;

  afterEach(async () => {
    if (kv) {
      try {
        await kv.close();
      } catch {
        // 忽略关闭时的错误
      }
    }
  });

  it('能成功获取 KV 实例', async () => {
    kv = await getKv();
    expect(kv).toBeDefined();
    expect(typeof kv.set).toBe('function');
    expect(typeof kv.get).toBe('function');
    expect(typeof kv.delete).toBe('function');
    expect(typeof kv.close).toBe('function');
  });

  it('能写入并读取数据', async () => {
    kv = await getKv();
    const value = { ping: 'pong', at: new Date().toISOString() };
    await kv.set(TEST_KEY, value);
    const entry = await kv.get(TEST_KEY);
    expect(entry.value).toEqual(value);
    expect(entry.key).toEqual(TEST_KEY);
  });

  it('能删除数据', async () => {
    kv = await getKv();
    await kv.set(TEST_KEY, { temp: true });
    await kv.delete(TEST_KEY);
    const entry = await kv.get(TEST_KEY);
    expect(entry.value).toBeNull();
  });
});
