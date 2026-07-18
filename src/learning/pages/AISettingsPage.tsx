import { useState } from 'react';
import { motion } from 'framer-motion';
import { Cpu, Play, Route, Settings2 } from 'lucide-react';
import { LearningHeader } from '../components/LearningHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { ProviderCard } from '../scenarioEngine/components/ScenarioComponents';
import { aiRegistry, aiService, getAIConfig, setAIConfig } from '../ai';
import type { AIResponse, RoutingStrategy } from '../ai/types';

const STRATEGIES: RoutingStrategy[] = [
  'default', 'cheapest', 'fastest', 'highest_quality', 'lowest_latency', 'round_robin', 'priority', 'fallback_chain',
];

export function AISettingsPage() {
  const [, force] = useState(0);
  const rerender = () => force((n) => n + 1);
  const [result, setResult] = useState<AIResponse | null>(null);
  const [testing, setTesting] = useState(false);

  const config = getAIConfig();
  const providers = aiRegistry.all();
  const defaultId = aiRegistry.getDefaultId();

  const runTest = async () => {
    setTesting(true);
    const res = await aiService.generate({ task: 'conversation', input: 'A customer is upset about a late delivery. Respond in character.' });
    setResult(res);
    setTesting(false);
  };

  return (
    <div className="min-h-screen bg-ink-100 dark:bg-ink-950">
      <LearningHeader back={{ label: 'Scenarios', to: '/learning/scenarios' }} />
      <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-2 text-lava-700 dark:text-lava-400 mb-1">
            <Cpu size={18} /><span className="text-sm font-semibold uppercase tracking-wide">AI Providers</span>
          </div>
          <h1 className="section-title text-3xl">Provider abstraction layer</h1>
          <p className="text-ink-500 dark:text-ink-400 mt-1 max-w-2xl">
            All AI requests route through one interface. Swap, enable, or reprioritize providers with no code changes. Mock providers only in this stage.
          </p>
        </motion.div>

        {/* Routing config */}
        <Card className="p-5">
          <h3 className="font-display font-bold text-ink-800 dark:text-ink-100 mb-4 flex items-center gap-2"><Route size={18} className="text-lava-600" /> Routing Strategy</h3>
          <div className="flex flex-wrap gap-2">
            {STRATEGIES.map((s) => (
              <button key={s} onClick={() => { setAIConfig({ routingStrategy: s }); rerender(); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  config.routingStrategy === s ? 'bg-lava-700 text-white' : 'bg-ink-50 dark:bg-ink-800 text-ink-600 dark:text-ink-300 hover:bg-ink-100 dark:hover:bg-ink-700'
                }`}>{s.replace(/_/g, ' ')}</button>
            ))}
          </div>
          <div className="mt-4">
            <p className="text-xs uppercase tracking-wide text-ink-400 mb-2 flex items-center gap-1.5"><Settings2 size={12} /> Task routing rules</p>
            <div className="flex flex-wrap gap-2">
              {config.routingRules.map((r) => (
                <span key={r.task} className="badge bg-ink-50 dark:bg-ink-800/60 text-ink-600 dark:text-ink-300">
                  {r.task} → {aiRegistry.get(r.providerId)?.metadata.name ?? r.providerId}
                </span>
              ))}
            </div>
          </div>
        </Card>

        {/* Providers */}
        <div className="grid md:grid-cols-2 gap-4">
          {providers.map((p) => (
            <ProviderCard
              key={p.metadata.id}
              provider={p}
              enabled={aiRegistry.isEnabled(p.metadata.id)}
              isDefault={defaultId === p.metadata.id}
              onToggle={() => { aiRegistry.isEnabled(p.metadata.id) ? aiRegistry.disable(p.metadata.id) : aiRegistry.enable(p.metadata.id); rerender(); }}
              onMakeDefault={() => { aiRegistry.setDefault(p.metadata.id); setAIConfig({ defaultProvider: p.metadata.id }); rerender(); }}
            />
          ))}
        </div>

        {/* Live test */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display font-bold text-ink-800 dark:text-ink-100 flex items-center gap-2"><Play size={18} className="text-lava-600" /> Test a request</h3>
            <Button size="sm" onClick={runTest} disabled={testing}>{testing ? 'Routing…' : 'Run conversation request'}</Button>
          </div>
          {result && (
            <div className="rounded-xl bg-ink-50 dark:bg-ink-800/50 p-4 space-y-2">
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="badge bg-white dark:bg-ink-900">Provider: {result.provider}</span>
                <span className="badge bg-white dark:bg-ink-900">Model: {result.model}</span>
                <span className="badge bg-white dark:bg-ink-900">Latency: {result.latencyMs}ms</span>
                <span className="badge bg-white dark:bg-ink-900">Tokens: {result.tokens.total}</span>
                <span className="badge bg-white dark:bg-ink-900">Cost: ${result.cost}</span>
                <span className="badge bg-white dark:bg-ink-900">Confidence: {Math.round(result.confidence * 100)}%</span>
              </div>
              <p className="text-sm text-ink-700 dark:text-ink-200 italic">"{String(result.response)}"</p>
              <p className="text-[11px] text-ink-400">Standardized AIResponse — identical shape regardless of provider.</p>
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}
