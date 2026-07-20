// Performance utilities (Phase 8). Small, dependency-free helpers reused across services:
// a TTL cache, a memoizer, and retry-with-backoff. Bundle-friendly (tree-shakeable named
// exports); heavy pages already use React.lazy + Suspense for code-splitting.

export class TTLCache<V> {
  private store = new Map<string, { value: V; expires: number }>();
  constructor(private ttlMs = 60000) {}
  get(key: string): V | undefined {
    const hit = this.store.get(key);
    if (!hit) return undefined;
    if (hit.expires < Date.now()) { this.store.delete(key); return undefined; }
    return hit.value;
  }
  set(key: string, value: V): void { this.store.set(key, { value, expires: Date.now() + this.ttlMs }); }
  clear(): void { this.store.clear(); }
}

export function memoize<A extends unknown[], R>(fn: (...args: A) => R, keyFn?: (...args: A) => string): (...args: A) => R {
  const cache = new Map<string, R>();
  return (...args: A): R => {
    const key = keyFn ? keyFn(...args) : JSON.stringify(args);
    if (cache.has(key)) return cache.get(key)!;
    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
}

export async function retry<T>(fn: () => Promise<T>, opts: { retries?: number; backoffMs?: number } = {}): Promise<T> {
  const retries = opts.retries ?? 3;
  const backoff = opts.backoffMs ?? 250;
  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try { return await fn(); }
    catch (err) { lastErr = err; if (attempt < retries) await new Promise((r) => setTimeout(r, backoff * (attempt + 1))); }
  }
  throw lastErr;
}
