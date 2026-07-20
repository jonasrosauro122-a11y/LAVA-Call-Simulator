export interface EmailTemplate {
  header: string;
  footer: string;
  accentColor: string;
}

export interface BrandingTheme {
  companyName: string;
  logoUrl?: string;
  faviconUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  dashboardTagline: string;
  emailTemplate: EmailTemplate;
}

// Default = LAVA's own brand. Per-company white-label is NOT implemented yet; this
// engine only manages a single active theme and exposes CSS-variable resolution so a
// future stage can swap themes per tenant without touching components.
export const DEFAULT_BRANDING: BrandingTheme = {
  companyName: 'LAVA',
  primaryColor: '#8B0000',
  secondaryColor: '#1a1a1a',
  fontFamily: "'Sora', 'Inter', sans-serif",
  dashboardTagline: 'AI Communication Skills Platform',
  emailTemplate: { header: 'LAVA', footer: '© LAVA', accentColor: '#8B0000' },
};

type Listener = (t: BrandingTheme) => void;

class BrandingService {
  private current: BrandingTheme = { ...DEFAULT_BRANDING };
  private listeners = new Set<Listener>();

  get(): BrandingTheme { return { ...this.current }; }
  set(patch: Partial<BrandingTheme>): void {
    this.current = { ...this.current, ...patch };
    this.listeners.forEach((l) => l(this.get()));
  }
  reset(): void { this.set({ ...DEFAULT_BRANDING }); }

  // For future injection into :root; components keep using existing design tokens today.
  resolveCssVars(): Record<string, string> {
    return {
      '--brand-primary': this.current.primaryColor,
      '--brand-secondary': this.current.secondaryColor,
      '--brand-font': this.current.fontFamily,
    };
  }

  subscribe(l: Listener): () => void { this.listeners.add(l); return () => this.listeners.delete(l); }
}

export const branding = new BrandingService();
