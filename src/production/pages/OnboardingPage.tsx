import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Building2, Briefcase, Cpu, Mic, GraduationCap, UserPlus, CheckCircle2, Circle, ArrowRight, PartyPopper } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Logo } from '../../components/ui/Logo';
import { tenantProvisioner } from '../../tenant/tenantProvisioner';
import { tenantConfigurationService } from '../../tenant/tenantConfigurationService';
import { tenantEngine } from '../../tenant/tenantEngine';
import { tenantResolver } from '../../tenant/tenantResolver';

const INDUSTRIES = ['Insurance', 'Sales / Cold Calling', 'Medical VA', 'Customer Support', 'Real Estate', 'Other'];
const AI_PROVIDERS = ['openai', 'claude', 'gemini', 'azure-openai'];
const VOICE_PROVIDERS = ['deepgram', 'whisper', 'elevenlabs'];
const PATHS = ['General English', 'Insurance CSR', 'Cold Calling Pro', 'Medical VA', 'Customer Support'];

const STEPS = ['Company', 'Industry', 'AI', 'Voice', 'Learning', 'Invites', 'Done'];

export function OnboardingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [company, setCompany] = useState('');
  const [industry, setIndustry] = useState(INDUSTRIES[0]);
  const [ai, setAi] = useState(AI_PROVIDERS[0]);
  const [voice, setVoice] = useState(VOICE_PROVIDERS[0]);
  const [paths, setPaths] = useState<string[]>(['General English']);
  const [invites, setInvites] = useState('');
  const [createdId, setCreatedId] = useState<string | null>(null);

  const togglePath = (p: string) => setPaths((prev) => prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]);

  const finish = () => {
    const { tenant } = tenantProvisioner.provision({ name: company.trim() || 'My Company', plan: 'starter' });
    const ctx = tenantEngine.contextFor(tenant.id);
    tenantConfigurationService.setAI(ctx, { provider: ai });
    tenantConfigurationService.setVoice(ctx, { speechProvider: voice });
    tenantEngine.update(tenant.id, { branding: { ...tenant.branding, dashboardBanner: industry } });
    tenantResolver.setCurrent(tenant.id);
    setCreatedId(tenant.id);
    setStep(STEPS.length - 1);
  };

  const next = () => setStep((s) => Math.min(STEPS.length - 1, s + 1));
  const back = () => setStep((s) => Math.max(0, s - 1));

  return (
    <div className="min-h-screen bg-ink-100 dark:bg-ink-950">
      <header className="border-b border-ink-100 dark:border-ink-800 bg-white/70 dark:bg-ink-900/70 backdrop-blur">
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
          <Logo size="sm" />
          <span className="text-sm text-ink-400">Workspace setup</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10">
        {/* Progress checklist */}
        <div className="flex items-center gap-2 mb-8 flex-wrap">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-1.5 text-xs">
              {i < step ? <CheckCircle2 size={16} className="text-green-600" /> : i === step ? <Circle size={16} className="text-lava-600 fill-lava-600/20" /> : <Circle size={16} className="text-ink-300 dark:text-ink-600" />}
              <span className={i === step ? 'text-ink-800 dark:text-ink-100 font-medium' : 'text-ink-400'}>{s}</span>
              {i < STEPS.length - 1 && <span className="text-ink-300 dark:text-ink-700 mx-1">·</span>}
            </div>
          ))}
        </div>

        <motion.div key={step} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          {step === 0 && (
            <Card className="p-6">
              <h1 className="section-title text-2xl mb-1 flex items-center gap-2"><Building2 size={22} className="text-lava-600" /> Create your workspace</h1>
              <p className="text-ink-500 dark:text-ink-400 text-sm mb-4">This creates a fully isolated tenant with its own users, branding, and configuration.</p>
              <input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Company name" className="w-full px-3 py-2 rounded-lg border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-900 text-sm text-ink-700 dark:text-ink-200" />
              <div className="flex justify-end mt-6"><Button onClick={next} disabled={!company.trim()}>Continue <ArrowRight size={16} /></Button></div>
            </Card>
          )}
          {step === 1 && (
            <Card className="p-6">
              <h1 className="section-title text-2xl mb-4 flex items-center gap-2"><Briefcase size={22} className="text-lava-600" /> Choose your industry</h1>
              <div className="grid grid-cols-2 gap-2">
                {INDUSTRIES.map((i) => (
                  <button key={i} onClick={() => setIndustry(i)} className={`px-4 py-3 rounded-lg text-sm text-left border transition-colors ${industry === i ? 'border-lava-500 bg-lava-50 dark:bg-lava-950/40 text-lava-700 dark:text-lava-400' : 'border-ink-200 dark:border-ink-700 text-ink-600 dark:text-ink-300'}`}>{i}</button>
                ))}
              </div>
              <div className="flex justify-between mt-6"><Button variant="ghost" onClick={back}>Back</Button><Button onClick={next}>Continue <ArrowRight size={16} /></Button></div>
            </Card>
          )}
          {step === 2 && (
            <Card className="p-6">
              <h1 className="section-title text-2xl mb-4 flex items-center gap-2"><Cpu size={22} className="text-lava-600" /> Preferred AI provider</h1>
              <div className="grid grid-cols-2 gap-2">
                {AI_PROVIDERS.map((p) => (
                  <button key={p} onClick={() => setAi(p)} className={`px-4 py-3 rounded-lg text-sm border capitalize transition-colors ${ai === p ? 'border-lava-500 bg-lava-50 dark:bg-lava-950/40 text-lava-700 dark:text-lava-400' : 'border-ink-200 dark:border-ink-700 text-ink-600 dark:text-ink-300'}`}>{p.replace('-', ' ')}</button>
                ))}
              </div>
              <p className="text-xs text-ink-400 mt-3">Providers activate when their API key is configured; until then a deterministic engine is used.</p>
              <div className="flex justify-between mt-6"><Button variant="ghost" onClick={back}>Back</Button><Button onClick={next}>Continue <ArrowRight size={16} /></Button></div>
            </Card>
          )}
          {step === 3 && (
            <Card className="p-6">
              <h1 className="section-title text-2xl mb-4 flex items-center gap-2"><Mic size={22} className="text-lava-600" /> Preferred voice provider</h1>
              <div className="grid grid-cols-3 gap-2">
                {VOICE_PROVIDERS.map((p) => (
                  <button key={p} onClick={() => setVoice(p)} className={`px-4 py-3 rounded-lg text-sm border capitalize transition-colors ${voice === p ? 'border-lava-500 bg-lava-50 dark:bg-lava-950/40 text-lava-700 dark:text-lava-400' : 'border-ink-200 dark:border-ink-700 text-ink-600 dark:text-ink-300'}`}>{p}</button>
                ))}
              </div>
              <div className="flex justify-between mt-6"><Button variant="ghost" onClick={back}>Back</Button><Button onClick={next}>Continue <ArrowRight size={16} /></Button></div>
            </Card>
          )}
          {step === 4 && (
            <Card className="p-6">
              <h1 className="section-title text-2xl mb-4 flex items-center gap-2"><GraduationCap size={22} className="text-lava-600" /> Learning paths</h1>
              <div className="space-y-2">
                {PATHS.map((p) => (
                  <label key={p} className="flex items-center gap-3 px-4 py-2.5 rounded-lg border border-ink-200 dark:border-ink-700 cursor-pointer">
                    <input type="checkbox" checked={paths.includes(p)} onChange={() => togglePath(p)} className="accent-lava-600" />
                    <span className="text-sm text-ink-700 dark:text-ink-200">{p}</span>
                  </label>
                ))}
              </div>
              <div className="flex justify-between mt-6"><Button variant="ghost" onClick={back}>Back</Button><Button onClick={next}>Continue <ArrowRight size={16} /></Button></div>
            </Card>
          )}
          {step === 5 && (
            <Card className="p-6">
              <h1 className="section-title text-2xl mb-4 flex items-center gap-2"><UserPlus size={22} className="text-lava-600" /> Invite your team</h1>
              <textarea value={invites} onChange={(e) => setInvites(e.target.value)} rows={4} placeholder="trainer@company.com, learner@company.com…" className="w-full px-3 py-2 rounded-lg border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-900 text-sm text-ink-700 dark:text-ink-200" />
              <p className="text-xs text-ink-400 mt-2">Invites are queued; delivery activates once an email provider is configured.</p>
              <div className="flex justify-between mt-6"><Button variant="ghost" onClick={back}>Back</Button><Button onClick={finish}>Create workspace <ArrowRight size={16} /></Button></div>
            </Card>
          )}
          {step === 6 && (
            <Card className="p-8 text-center">
              <PartyPopper size={36} className="text-lava-600 mx-auto mb-3" />
              <h1 className="section-title text-2xl mb-1">You're all set!</h1>
              <p className="text-ink-500 dark:text-ink-400 text-sm mb-6">{company || 'Your workspace'} was provisioned with roles, branding, AI, voice, and learning defaults.</p>
              <div className="flex justify-center gap-2">
                {createdId && <Button onClick={() => navigate(`/admin/tenant/${createdId}`)}>Open tenant dashboard</Button>}
                <Button variant="secondary" onClick={() => navigate('/dashboard')}>Go to app</Button>
              </div>
            </Card>
          )}
        </motion.div>
      </main>
    </div>
  );
}
