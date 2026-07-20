import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Clock, MessageSquare, AlertTriangle, ThumbsUp, Info, Flag, Heart, Mic, Volume2, type LucideIcon,
} from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import type { VoiceTimelineEvent, LiveCue, FillerReport, VoiceEventKind } from '../types';

const KIND_META: Record<VoiceEventKind, { color: string; icon: LucideIcon }> = {
  phase: { color: '#6b7280', icon: Flag },
  pause: { color: '#f59e0b', icon: Clock },
  interruption: { color: '#db2777', icon: AlertTriangle },
  high_confidence: { color: '#16a34a', icon: ThumbsUp },
  low_confidence: { color: '#b71c1c', icon: AlertTriangle },
  empathy: { color: '#8B0000', icon: Heart },
  missed_opportunity: { color: '#f59e0b', icon: Flag },
  recommendation: { color: '#2563eb', icon: Info },
};

// Feature 8 — clickable timeline.
export function VoiceTimeline({ events }: { events: VoiceTimelineEvent[] }) {
  const [selected, setSelected] = useState<VoiceTimelineEvent | null>(events[0] ?? null);
  return (
    <div>
      <div className="relative pl-6">
        <div className="absolute left-2 top-1 bottom-1 w-px bg-ink-200 dark:bg-ink-700" />
        <div className="space-y-3">
          {events.map((e) => {
            const meta = KIND_META[e.kind];
            const Icon = meta.icon;
            const active = selected?.id === e.id;
            return (
              <button key={e.id} onClick={() => setSelected(e)}
                className={`relative w-full text-left flex items-center gap-3 rounded-lg p-2 transition-colors ${active ? 'bg-ink-50 dark:bg-ink-800/60' : 'hover:bg-ink-50/60 dark:hover:bg-ink-800/40'}`}>
                <span className="absolute -left-[18px] top-1/2 -translate-y-1/2 w-3 h-3 rounded-full ring-4 ring-white dark:ring-ink-900" style={{ background: meta.color }} />
                <Icon size={15} style={{ color: meta.color }} className="shrink-0" />
                <span className="text-xs font-mono text-ink-400 w-12 shrink-0">{e.time}</span>
                <span className="text-sm text-ink-700 dark:text-ink-200 flex-1">{e.label}</span>
                {typeof e.score === 'number' && <span className="text-xs font-semibold" style={{ color: meta.color }}>{e.score}</span>}
              </button>
            );
          })}
        </div>
      </div>
      {selected && (
        <motion.div key={selected.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
          className="mt-4 rounded-xl bg-ink-50 dark:bg-ink-800/50 p-4">
          <p className="text-xs font-mono text-ink-400 mb-1">{selected.time} · {selected.label}</p>
          <p className="text-sm text-ink-700 dark:text-ink-200">{selected.detail}</p>
        </motion.div>
      )}
    </div>
  );
}

// Feature 9 — live coach feed.
const SEV_COLOR: Record<LiveCue['severity'], string> = { positive: '#16a34a', info: '#2563eb', warning: '#b71c1c' };
export function LiveCoachFeed({ cues }: { cues: LiveCue[] }) {
  if (!cues.length) return <p className="text-sm text-ink-500 dark:text-ink-400">No coaching cues for this session.</p>;
  return (
    <div className="space-y-2">
      {cues.map((c, i) => (
        <motion.div key={i} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
          className="flex items-center gap-3 rounded-lg bg-ink-50 dark:bg-ink-800/50 p-2.5">
          <MessageSquare size={15} style={{ color: SEV_COLOR[c.severity] }} className="shrink-0" />
          <span className="text-xs font-mono text-ink-400 w-12 shrink-0">{c.time}</span>
          <span className="text-sm text-ink-700 dark:text-ink-200">{c.message}</span>
        </motion.div>
      ))}
    </div>
  );
}

// Feature 3 — filler timeline + counts.
export function FillerTimeline({ fillers, durationSeconds }: { fillers: FillerReport; durationSeconds: number }) {
  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4">
        {fillers.byWord.length === 0 && <span className="text-sm text-ink-500 dark:text-ink-400">No filler words detected — clean delivery.</span>}
        {fillers.byWord.map((w) => (
          <span key={w.word} className="badge bg-lava-50 dark:bg-lava-950/40 text-lava-700 dark:text-lava-400">"{w.word}" × {w.count}</span>
        ))}
      </div>
      {fillers.timeline.length > 0 && (
        <div className="relative h-8 rounded-lg bg-ink-100 dark:bg-ink-800">
          {fillers.timeline.map((h, i) => (
            <span key={i} title={`${h.word} @ ${h.time}`} className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full gradient-lava"
              style={{ left: `${Math.min(98, (h.atSec / Math.max(durationSeconds, 1)) * 100)}%` }} />
          ))}
        </div>
      )}
    </div>
  );
}

export function StatTile({ icon: Icon, label, value, sub }: { icon: LucideIcon; label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-xl bg-ink-50 dark:bg-ink-800/50 p-4">
      <Icon size={16} className="text-lava-600 mb-1" />
      <p className="font-display text-lg font-bold text-ink-800 dark:text-ink-100">{value}</p>
      <p className="text-xs text-ink-500 dark:text-ink-400">{label}</p>
      {sub && <p className="text-[11px] text-ink-400 mt-0.5">{sub}</p>}
    </div>
  );
}

// Small provider badge for the replay header.
export function VoiceProviderBadge({ provider, mode }: { provider: string; mode: string }) {
  return (
    <Card className="px-3 py-2 flex items-center gap-2 !shadow-none">
      <Mic size={14} className="text-lava-600" />
      <span className="text-xs text-ink-600 dark:text-ink-300">{provider}</span>
      <span className="badge bg-ink-100 dark:bg-ink-800 text-ink-500 flex items-center gap-1"><Volume2 size={10} /> {mode}</span>
    </Card>
  );
}
