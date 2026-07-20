import { uid, nowIso, type EventType } from './types';

export interface EventEnvelope<T = unknown> {
  id: string;
  type: EventType;
  payload: T;
  timestamp: string;
  correlationId: string;
  priority: number; // higher runs first
  source?: string;
  metadata?: Record<string, unknown>;
}

export type EventHandler<T = unknown> = (e: EventEnvelope<T>) => void | Promise<void>;

interface Subscription {
  id: string;
  type: EventType | '*';
  handler: EventHandler;
  priority: number;
}

export interface PublishOptions {
  correlationId?: string;
  priority?: number;
  source?: string;
  metadata?: Record<string, unknown>;
  retries?: number;
  retryBackoffMs?: number;
}

// Future websocket compatibility: a transport can forward locally-published events
// to a remote peer, and feed remote events back in via ingest(). No business logic
// changes when a real socket is attached — only this seam is implemented.
export interface EventTransport {
  send(envelope: EventEnvelope): void | Promise<void>;
}

/**
 * EventBus — application-wide publish/subscribe. Independent modules communicate
 * through named events instead of importing each other. Supports priority ordering,
 * wildcard subscriptions, per-publish retry with backoff, a bounded history ring
 * buffer (for inspection / websocket replay), and a pluggable transport.
 */
class EventBus {
  private subs = new Map<string, Subscription[]>();
  private history: EventEnvelope[] = [];
  private maxHistory = 200;
  private transport: EventTransport | null = null;

  subscribe<T = unknown>(type: EventType | '*', handler: EventHandler<T>, opts: { priority?: number } = {}): () => void {
    const sub: Subscription = { id: uid('sub'), type, handler: handler as EventHandler, priority: opts.priority ?? 0 };
    const list = this.subs.get(type) ?? [];
    list.push(sub);
    list.sort((a, b) => b.priority - a.priority);
    this.subs.set(type, list);
    return () => this.unsubscribe(type, sub.id);
  }

  subscribeAny(handler: EventHandler, opts: { priority?: number } = {}): () => void {
    return this.subscribe('*', handler, opts);
  }

  unsubscribe(type: EventType | '*', id: string): void {
    const list = this.subs.get(type);
    if (!list) return;
    this.subs.set(type, list.filter((s) => s.id !== id));
  }

  attachTransport(t: EventTransport | null): void {
    this.transport = t;
  }

  async publish<T = unknown>(type: EventType, payload: T, opts: PublishOptions = {}): Promise<EventEnvelope<T>> {
    const envelope: EventEnvelope<T> = {
      id: uid('evt'), type, payload, timestamp: nowIso(),
      correlationId: opts.correlationId ?? uid('corr'),
      priority: opts.priority ?? 0, source: opts.source, metadata: opts.metadata,
    };
    this.record(envelope);
    if (this.transport) { try { await this.transport.send(envelope as EventEnvelope); } catch { /* transport best-effort */ } }
    const targeted = this.subs.get(type) ?? [];
    const wildcard = this.subs.get('*') ?? [];
    const handlers = [...targeted, ...wildcard].sort((a, b) => b.priority - a.priority);
    for (const sub of handlers) {
      await this.dispatch(sub.handler, envelope as EventEnvelope, opts.retries ?? 0, opts.retryBackoffMs ?? 250);
    }
    return envelope;
  }

  // Feed an event received from a remote transport into the local bus (no re-send).
  async ingest(envelope: EventEnvelope): Promise<void> {
    this.record(envelope);
    const handlers = [...(this.subs.get(envelope.type) ?? []), ...(this.subs.get('*') ?? [])].sort((a, b) => b.priority - a.priority);
    for (const sub of handlers) await this.dispatch(sub.handler, envelope, 0, 0);
  }

  private async dispatch(handler: EventHandler, envelope: EventEnvelope, retries: number, backoff: number): Promise<void> {
    let attempt = 0;
    for (;;) {
      try { await handler(envelope); return; }
      catch (err) {
        if (attempt >= retries) { console.warn('[EventBus] handler failed', envelope.type, err); return; }
        attempt++;
        await new Promise((r) => setTimeout(r, backoff * attempt));
      }
    }
  }

  private record(e: EventEnvelope): void {
    this.history.push(e);
    if (this.history.length > this.maxHistory) this.history.shift();
  }

  getHistory(limit = 50): EventEnvelope[] {
    return this.history.slice(-limit).reverse();
  }

  subscriptionCount(): number {
    let n = 0;
    for (const list of this.subs.values()) n += list.length;
    return n;
  }
}

export const eventBus = new EventBus();
