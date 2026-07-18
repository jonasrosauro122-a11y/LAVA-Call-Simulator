import { motion } from 'framer-motion';
import { User, Zap, Gauge, Cpu, CheckCircle2, XCircle } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import type { Personality, Emotion, ScenarioDifficulty } from '../types';
import { DIFFICULTIES } from '../difficultyEngine';
import type { AIProvider } from '../../ai/types';

const EMOTION_COLOR: Record<string, string> = {
  Happy: '#16a34a', Satisfied: '#16a34a', Excited: '#16a34a',
  Neutral: '#6b7280', Curious: '#0ea5e9', Confused: '#f59e0b', Anxious: '#f59e0b',
  Impatient: '#db2777', Frustrated: '#b71c1c', Disappointed: '#b71c1c',
};

export function EmotionChip({ emotion }: { emotion: Emotion }) {
  return (
    <span className="badge" style={{ color: EMOTION_COLOR[emotion] ?? '#6b7280', background: `${EMOTION_COLOR[emotion] ?? '#6b7280'}1a` }}>
      {emotion}
    </span>
  );
}

export function DifficultyPips({ difficulty }: { difficulty: ScenarioDifficulty }) {
  const idx = DIFFICULTIES.indexOf(difficulty);
  return (
    <div className="flex items-center gap-2">
      <span className="font-semibold text-sm text-ink-800 dark:text-ink-100">{difficulty}</span>
      <div className="flex gap-1">
        {DIFFICULTIES.map((_, i) => (
          <span key={i} className={`h-1.5 w-4 rounded-full ${i <= idx ? 'gradient-lava' : 'bg-ink-200 dark:bg-ink-700'}`} />
        ))}
      </div>
    </div>
  );
}

export function PersonaCard({ personality, emotion }: { personality: Personality; emotion: Emotion }) {
  const attrs: { label: string; value: string | number }[] = [
    { label: 'Style', value: personality.communicationStyle },
    { label: 'Patience', value: `${personality.patience}/100` },
    { label: 'Knowledge', value: `${personality.knowledge}/100` },
    { label: 'Formality', value: `${personality.formality}/100` },
    { label: 'Trust', value: `${personality.trust}/100` },
    { label: 'Vocabulary', value: personality.vocabulary },
    { label: 'Questions', value: personality.questionComplexity },
    { label: 'Decisions', value: personality.decisionBehavior },
    { label: 'Accent', value: personality.accent },
  ];
  return (
    <Card className="p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-xl gradient-lava flex items-center justify-center text-white shrink-0"><User size={22} /></div>
        <div>
          <h3 className="font-display font-bold text-ink-800 dark:text-ink-100">{personality.name}</h3>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-ink-500 dark:text-ink-400">{personality.archetype}</span>
            <EmotionChip emotion={emotion} />
          </div>
        </div>
      </div>
      <p className="text-sm text-ink-600 dark:text-ink-300 italic mb-4">"{personality.responseStyle}"</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2">
        {attrs.map((a) => (
          <div key={a.label}>
            <p className="text-[11px] uppercase tracking-wide text-ink-400">{a.label}</p>
            <p className="text-sm font-medium text-ink-700 dark:text-ink-200 capitalize">{a.value}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

export function MetaTile({ icon: Icon, label, value }: { icon: typeof Zap; label: string; value: string }) {
  return (
    <div className="rounded-xl bg-ink-50 dark:bg-ink-800/50 p-4">
      <Icon size={16} className="text-lava-600 mb-1" />
      <p className="text-[11px] uppercase tracking-wide text-ink-400">{label}</p>
      <p className="text-sm font-semibold text-ink-800 dark:text-ink-100">{value}</p>
    </div>
  );
}

// ---- AI provider card (for the AI settings page) ----
export function ProviderCard({ provider, enabled, isDefault, onToggle, onMakeDefault }: {
  provider: AIProvider; enabled: boolean; isDefault: boolean;
  onToggle: () => void; onMakeDefault: () => void;
}) {
  const m = provider.metadata;
  const caps = [
    ['Streaming', m.capabilities.streaming], ['Vision', m.capabilities.vision],
    ['Audio', m.capabilities.audio], ['Functions', m.capabilities.functionCalling],
    ['Structured', m.capabilities.structuredOutput],
  ] as const;
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <Card className={`p-5 ${enabled ? '' : 'opacity-60'}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-lava flex items-center justify-center text-white shrink-0"><Cpu size={18} /></div>
            <div>
              <h3 className="font-display font-bold text-ink-800 dark:text-ink-100 flex items-center gap-2">
                {m.name}
                {isDefault && <span className="badge bg-lava-50 dark:bg-lava-950/40 text-lava-700 dark:text-lava-400">Default</span>}
                {m.local && <span className="badge bg-ink-100 dark:bg-ink-800 text-ink-500">Local</span>}
              </h3>
              <p className="text-xs text-ink-500 dark:text-ink-400">{m.model}</p>
            </div>
          </div>
          <button onClick={onToggle} className={`badge ${enabled ? 'bg-green-50 dark:bg-green-900/20 text-green-600' : 'bg-ink-100 dark:bg-ink-800 text-ink-500'}`}>
            {enabled ? <><CheckCircle2 size={12} /> Enabled</> : <><XCircle size={12} /> Disabled</>}
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2 mt-4 text-center">
          <MetaTile icon={Gauge} label="Latency" value={`${m.latencyEstimateMs}ms`} />
          <MetaTile icon={Zap} label="Cost/1k" value={m.estimatedCostPer1kTokens === 0 ? 'Free' : `$${m.estimatedCostPer1kTokens}`} />
          <MetaTile icon={Cpu} label="Context" value={`${Math.round(m.capabilities.maxContextWindow / 1000)}k`} />
        </div>

        <div className="flex flex-wrap gap-1.5 mt-3">
          {caps.map(([label, on]) => (
            <span key={label} className={`badge ${on ? 'bg-lava-50 dark:bg-lava-950/40 text-lava-700 dark:text-lava-400' : 'bg-ink-100 dark:bg-ink-800 text-ink-400'}`}>{label}</span>
          ))}
        </div>

        {!isDefault && enabled && (
          <button onClick={onMakeDefault} className="btn-ghost text-xs mt-3">Make default</button>
        )}
      </Card>
    </motion.div>
  );
}
