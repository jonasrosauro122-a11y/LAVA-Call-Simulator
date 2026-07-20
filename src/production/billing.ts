import { eventBus } from '../platform/eventBus';
import { environment } from './environment';
import { PLANS } from '../tenant/defaults';
import type { PlanTier, TenantContext } from '../tenant/types';

// Billing architecture (Phase 3). No provider is hardcoded and no charges are made — this
// defines the abstraction every billing backend implements, plus a manual/offline default
// so the platform is fully functional without a payment processor. Concrete Stripe/Paddle/
// etc. adapters are registered later behind this same interface.

export type BillingProviderId = 'stripe' | 'paddle' | 'lemonsqueezy' | 'chargebee' | 'manual';
export type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'canceled' | 'none';

export interface Coupon { code: string; percentOff: number; expiresAt?: string; }
export interface Invoice { id: string; tenantId: string; amountUsd: number; status: 'draft' | 'open' | 'paid' | 'void'; createdAt: string; lines: { label: string; amountUsd: number }[]; }
export interface SubscriptionState { tenantId: string; tier: PlanTier; status: SubscriptionStatus; trialEndsAt?: string; renewsAt?: string; provider: BillingProviderId; }
export interface MeteredEvent { tenantId: string; metric: string; quantity: number; at: string; }

export interface CheckoutSession { url: string; ready: boolean; note?: string; }

// The contract every billing backend fulfills.
export interface BillingProvider {
  id: BillingProviderId;
  isConfigured(): boolean;
  createCheckout(ctx: TenantContext, tier: PlanTier): Promise<CheckoutSession>;
  changePlan(ctx: TenantContext, tier: PlanTier): Promise<SubscriptionState>;
  cancel(ctx: TenantContext): Promise<SubscriptionState>;
  reportUsage(event: MeteredEvent): Promise<void>;
}

// Manual/offline provider — always available; records intent without external calls.
class ManualBillingProvider implements BillingProvider {
  id: BillingProviderId = 'manual';
  isConfigured() { return true; }
  async createCheckout(): Promise<CheckoutSession> {
    return { url: '', ready: false, note: 'Manual invoicing — no hosted checkout. Finance issues an invoice.' };
  }
  async changePlan(ctx: TenantContext, tier: PlanTier): Promise<SubscriptionState> {
    return { tenantId: ctx.tenantId, tier, status: 'active', provider: 'manual' };
  }
  async cancel(ctx: TenantContext): Promise<SubscriptionState> {
    return { tenantId: ctx.tenantId, tier: 'free', status: 'canceled', provider: 'manual' };
  }
  async reportUsage(): Promise<void> { /* recorded in usage service already */ }
}

// External providers become configured only when their secret env var is present.
class ExternalBillingProvider implements BillingProvider {
  constructor(public id: BillingProviderId, private secretKey: string) {}
  isConfigured() { return environment.has(this.secretKey); }
  async createCheckout(_ctx: TenantContext, _tier: PlanTier): Promise<CheckoutSession> {
    if (!this.isConfigured()) return { url: '', ready: false, note: `${this.id} not configured (set VITE_${this.secretKey}).` };
    // Real adapter posts to the provider API here; architecture only in this stage.
    return { url: '', ready: false, note: `${this.id} checkout requires server-side session creation.`, };
  }
  async changePlan(ctx: TenantContext, tier: PlanTier): Promise<SubscriptionState> {
    return { tenantId: ctx.tenantId, tier, status: this.isConfigured() ? 'active' : 'none', provider: this.id };
  }
  async cancel(ctx: TenantContext): Promise<SubscriptionState> {
    return { tenantId: ctx.tenantId, tier: 'free', status: 'canceled', provider: this.id };
  }
  async reportUsage(): Promise<void> { /* forwarded to provider metered API when configured */ }
}

class BillingService {
  private providers = new Map<BillingProviderId, BillingProvider>();
  private active: BillingProviderId = 'manual';
  private coupons = new Map<string, Coupon>();
  private invoices: Invoice[] = [];
  private metered: MeteredEvent[] = [];

  constructor() {
    this.register(new ManualBillingProvider());
    this.register(new ExternalBillingProvider('stripe', 'STRIPE_SECRET_KEY'));
    this.register(new ExternalBillingProvider('paddle', 'PADDLE_API_KEY'));
    this.register(new ExternalBillingProvider('lemonsqueezy', 'LEMONSQUEEZY_API_KEY'));
    this.register(new ExternalBillingProvider('chargebee', 'CHARGEBEE_API_KEY'));
    this.addCoupon({ code: 'LAUNCH50', percentOff: 50 });
  }

  register(p: BillingProvider): void { this.providers.set(p.id, p); }
  setActive(id: BillingProviderId): void { if (this.providers.has(id)) this.active = id; }
  provider(): BillingProvider { return this.providers.get(this.active)!; }
  listProviders(): { id: BillingProviderId; configured: boolean }[] {
    return [...this.providers.values()].map((p) => ({ id: p.id, configured: p.isConfigured() }));
  }

  plans() { return Object.values(PLANS); }
  addCoupon(c: Coupon): void { this.coupons.set(c.code, c); }
  applyCoupon(code: string, amountUsd: number): { amountUsd: number; applied: boolean } {
    const c = this.coupons.get(code.toUpperCase());
    if (!c || (c.expiresAt && new Date(c.expiresAt) < new Date())) return { amountUsd, applied: false };
    return { amountUsd: Math.round(amountUsd * (1 - c.percentOff / 100) * 100) / 100, applied: true };
  }

  async startTrial(ctx: TenantContext, tier: PlanTier, days = 14): Promise<SubscriptionState> {
    const state: SubscriptionState = {
      tenantId: ctx.tenantId, tier, status: 'trialing',
      trialEndsAt: new Date(Date.now() + days * 86400000).toISOString(), provider: this.active,
    };
    void eventBus.publish('SubscriptionChanged', { tenantId: ctx.tenantId, tier, status: 'trialing' }, { source: 'billing', metadata: { target: ctx.tenantId } });
    return state;
  }
  async changePlan(ctx: TenantContext, tier: PlanTier): Promise<SubscriptionState> {
    const state = await this.provider().changePlan(ctx, tier);
    void eventBus.publish('SubscriptionChanged', { tenantId: ctx.tenantId, tier, status: state.status }, { source: 'billing', metadata: { target: ctx.tenantId } });
    return state;
  }
  async cancel(ctx: TenantContext): Promise<SubscriptionState> { return this.provider().cancel(ctx); }

  createInvoice(ctx: TenantContext, lines: { label: string; amountUsd: number }[]): Invoice {
    const inv: Invoice = {
      id: `inv-${Date.now().toString(36)}`, tenantId: ctx.tenantId,
      amountUsd: lines.reduce((s, l) => s + l.amountUsd, 0), status: 'open',
      createdAt: new Date().toISOString(), lines,
    };
    this.invoices.push(inv);
    return inv;
  }
  invoicesFor(ctx: TenantContext): Invoice[] { return this.invoices.filter((i) => i.tenantId === ctx.tenantId); }
  recordUsage(e: MeteredEvent): void { this.metered.push(e); void this.provider().reportUsage(e); }
}

export const billingService = new BillingService();
