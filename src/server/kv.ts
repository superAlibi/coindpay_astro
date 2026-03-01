/**
 * 统一 Deno KV 入口：部署环境用 Deno.openKv()，开发环境用 @deno/kv（本地/内存或远程）。
 */

/** 与 Deno KV / @deno/kv 兼容的最小接口，供 getKv 返回类型使用 */
export interface Kv {
  get<T = unknown>(key: unknown[], options?: { consistency?: string }): Promise<{ value: T | null; versionstamp: string | null }>;
  set(key: unknown[], value: unknown, options?: { expireIn?: number }): Promise<{ ok: boolean; versionstamp: string }>;
  list<T = unknown>(selector: { prefix: unknown[] }, options?: { limit?: number; cursor?: string; reverse?: boolean }): AsyncIterable<{ key: unknown[]; value: T; versionstamp: string }>;
  delete(key: unknown[]): Promise<void>;
  close(): void;
}

let kvPromise: Promise<Kv> | null = null;

function getEnv(name: string): string | undefined {
  if (typeof globalThis === "undefined") return undefined;
  const g = globalThis as unknown as { process?: { env?: Record<string, string | undefined> } };
  return g.process?.env?.[name];
}

function getDeno(): { openKv?: (path?: string) => Promise<Kv> } | undefined {
  if (typeof globalThis === "undefined") return undefined;
  return (globalThis as unknown as { Deno?: { openKv?: (path?: string) => Promise<Kv> } }).Deno;
}

/**
 * 获取 KV 实例（单例）。在 Deno 运行时使用原生 Deno.openKv()，在 Node 下使用 @deno/kv。
 */
export async function getKv(): Promise<Kv> {
  if (kvPromise) return kvPromise;
  kvPromise = (async (): Promise<Kv> => {
    const deno = getDeno();
    if (deno && typeof deno.openKv === "function") {
      return (await deno.openKv()) as Kv;
    }
    const { openKv } = await import("@deno/kv");
    const url = getEnv("DENO_KV_CONNECT_URL");
    const token = getEnv("DENO_KV_ACCESS_TOKEN");
    if (url && token) {
      return await openKv(url) as Kv;
    }
    return (await openKv("")) as Kv; // 本地开发：内存 KV
  })();
  return kvPromise;
}
