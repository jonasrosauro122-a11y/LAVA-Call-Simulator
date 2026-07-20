import { uid, nowIso, type Severity } from './types';
import { eventBus, type EventEnvelope } from './eventBus';

export interface AuditEntry {
  id: string;
  actor: string;
  action: string;
  target?: string;
  timestamp: string;
  severity: Severity;
  correlationId?: string;
  metadata?: Record<string, unknown>;
}

// Maps notable event types to an audit severity when auto-recording from the bus.
const EVENT_SEVERITY: Record<string, Severity> = {
  RoleChanged: 'warning', CompanyCreated: 'notice', CertificateIssued: 'notice',
  FeatureFlagChanged: 'warning', ConfigChanged: 'warning', JobFailed: 'critical',
};

/**
 * AuditService — an append-only log of important actions (actor, action, target,
 * timestamp, severity, metadata). Records both explicit calls and, once bound,
 * every event flowing through the EventBus.
 */
class AuditService {
  private entries: AuditEntry[] = [];
  private max = 500;
  private bound = false;

  record(input: Omit<AuditEntry, 'id' | 'timestamp'> & { timestamp?: string }): AuditEntry {
    const entry: AuditEntry = {
      id: uid('audit'), timestamp: input.timestamp ?? nowIso(),
      actor: input.actor, action: input.action, target: input.target,
      severity: input.severity, correlationId: input.correlationId, metadata: input.metadata,
    };
    this.entries.push(entry);
    if (this.entries.length > this.max) this.entries.shift();
    return entry;
  }

  // Subscribe to the bus so every event is mirrored into the audit trail.
  bindToEventBus(): void {
    if (this.bound) return;
    this.bound = true;
    eventBus.subscribeAny((e: EventEnvelope) => {
      const actor = (e.metadata?.actor as string) ?? (e.source ?? 'system');
      this.record({
        actor, action: e.type, target: (e.metadata?.target as string) ?? undefined,
        severity: EVENT_SEVERITY[e.type] ?? 'info', correlationId: e.correlationId,
        metadata: { eventId: e.id },
      });
    }, { priority: -100 }); // run after functional handlers
  }

  list(filter?: { actor?: string; severity?: Severity; action?: string }): AuditEntry[] {
    let out = [...this.entries].reverse();
    if (filter?.actor) out = out.filter((e) => e.actor === filter.actor);
    if (filter?.severity) out = out.filter((e) => e.severity === filter.severity);
    if (filter?.action) out = out.filter((e) => e.action.includes(filter.action!));
    return out;
  }

  count(): number { return this.entries.length; }
}

export const auditService = new AuditService();
