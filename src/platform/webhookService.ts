import { uid, nowIso } from './types';
import { eventBus, type EventEnvelope } from './eventBus';

export type WebhookDirection = 'outgoing' | 'incoming';

export interface Webhook {
  id: string;
  label: string;
  direction: WebhookDirection;
  url?: string;
  events: string[]; // event types this webhook cares about ('*' = all)
  secret?: string;
  active: boolean;
  createdAt: string;
}

export type DeliveryStatus = 'pending' | 'delivered' | 'failed';

export interface WebhookDelivery {
  id: string;
  webhookId: string;
  event: string;
  status: DeliveryStatus;
  attempts: number;
  timestamp: string;
}

// Real HTTP delivery is provided by a transport in a later stage; the default is a
// logging no-op so the framework is fully wired without making network calls now.
export interface WebhookTransport {
  deliver(webhook: Webhook, payload: unknown): Promise<boolean>;
}

const loggingTransport: WebhookTransport = {
  async deliver(webhook) { console.info('[webhook] would deliver to', webhook.url ?? webhook.label); return true; },
};

/**
 * WebhookService — outgoing + incoming webhooks with retries, signing/verification
 * seams, and delivery logging. Subscribes to the EventBus so registering an outgoing
 * webhook for an event is all that's needed to start forwarding it (Slack, Discord,
 * Teams, Zapier, Make, CRM/LMS, etc.).
 */
class WebhookService {
  private hooks = new Map<string, Webhook>();
  private log: WebhookDelivery[] = [];
  private transport: WebhookTransport = loggingTransport;
  private bound = false;

  setTransport(t: WebhookTransport): void { this.transport = t; }

  register(input: Omit<Webhook, 'id' | 'createdAt' | 'active'> & { active?: boolean }): Webhook {
    const hook: Webhook = { id: uid('wh'), createdAt: nowIso(), active: input.active ?? true, ...input };
    this.hooks.set(hook.id, hook);
    return hook;
  }

  bindToEventBus(): void {
    if (this.bound) return;
    this.bound = true;
    eventBus.subscribeAny((e: EventEnvelope) => { void this.emit(e.type, e.payload); }, { priority: -90 });
  }

  async emit(event: string, payload: unknown): Promise<void> {
    const targets = [...this.hooks.values()].filter(
      (h) => h.direction === 'outgoing' && h.active && (h.events.includes('*') || h.events.includes(event)),
    );
    for (const hook of targets) await this.deliver(hook, event, payload, 3);
  }

  private async deliver(hook: Webhook, event: string, payload: unknown, retries: number): Promise<void> {
    const record: WebhookDelivery = { id: uid('whd'), webhookId: hook.id, event, status: 'pending', attempts: 0, timestamp: nowIso() };
    this.log.push(record);
    for (let i = 0; i <= retries; i++) {
      record.attempts++;
      try { if (await this.transport.deliver(hook, { event, payload, signature: this.sign(hook, payload) })) { record.status = 'delivered'; return; } }
      catch { /* retry */ }
    }
    record.status = 'failed';
  }

  // Incoming webhook entry point (from external systems), verified then re-published.
  ingest(event: string, payload: unknown, signature?: string, secret?: string): boolean {
    if (secret && !this.verify(secret, payload, signature)) return false;
    void eventBus.publish(event, payload, { source: 'webhook:incoming' });
    return true;
  }

  // Signing/verification architecture (HMAC-style seam; deterministic placeholder now).
  sign(hook: Webhook, payload: unknown): string { return this.hash(`${hook.secret ?? ''}:${JSON.stringify(payload)}`); }
  verify(secret: string, payload: unknown, signature?: string): boolean {
    return !!signature && signature === this.hash(`${secret}:${JSON.stringify(payload)}`);
  }
  private hash(s: string): string {
    let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
    return h.toString(16);
  }

  list(): Webhook[] { return [...this.hooks.values()]; }
  deliveries(limit = 50): WebhookDelivery[] { return [...this.log].reverse().slice(0, limit); }
}

export const webhooks = new WebhookService();
