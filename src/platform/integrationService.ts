export type IntegrationCategory = 'crm' | 'lms' | 'calendar' | 'comms' | 'productivity' | 'insurance' | 'meeting';

export type IntegrationStatus = 'disconnected' | 'connected' | 'error';

// A concrete connector is implemented in a future stage; this stage defines the
// interface every connector must satisfy so the rest of the app depends only on this.
export interface IntegrationConnector {
  id: string;
  connect(config: Record<string, unknown>): Promise<boolean>;
  disconnect(): Promise<void>;
  status(): IntegrationStatus;
  capabilities: string[];
}

export interface IntegrationDefinition {
  id: string;
  name: string;
  category: IntegrationCategory;
  description: string;
  capabilities: string[];
  available: boolean; // false = architecture registered, connector not yet shipped
}

/**
 * IntegrationService — a generic registry of external system definitions and (future)
 * connectors. This stage seeds the catalog of planned connectors; concrete connect()
 * logic arrives later by registering an IntegrationConnector for a definition id.
 */
class IntegrationService {
  private defs = new Map<string, IntegrationDefinition>();
  private connectors = new Map<string, IntegrationConnector>();

  define(def: IntegrationDefinition): void { if (!this.defs.has(def.id)) this.defs.set(def.id, def); }
  registerConnector(connector: IntegrationConnector): void {
    this.connectors.set(connector.id, connector);
    const def = this.defs.get(connector.id);
    if (def) def.available = true;
  }
  getConnector(id: string): IntegrationConnector | undefined { return this.connectors.get(id); }
  list(category?: IntegrationCategory): IntegrationDefinition[] {
    const all = [...this.defs.values()];
    return category ? all.filter((d) => d.category === category) : all;
  }
}

export const integrations = new IntegrationService();
