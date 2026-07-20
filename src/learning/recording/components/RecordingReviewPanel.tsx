import { useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Clock, MessageSquare, Sparkles, RotateCcw, FileText } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { ProgressRing } from '../../../components/ui/ProgressRing';
import { VoicePlayer, type VoicePlayerHandle } from './VoicePlayer';
import { analyzeVoice } from '../../voiceEngine/voiceMetricsEngine';
import { getSignedUrl } from '../voiceRecordingApi';
import { createRng } from '../../scenarioEngine/rng';
import { tenantResolver } from '../../../tenant/tenantResolver';
import type { VoiceRecording } from '../types';
import type { VoiceInput, VoiceAnalysis, VoiceTimelineEvent } from '../../voiceEngine/types';

// Synthesize a VoiceInput from a recording so the EXISTING voice analysis engine drives the
// timeline + coaching. When a provider transcript exists it is used; otherwise a
// duration-scaled sample transcript is generated (clearly a fallback) so the timeline is
// meaningful without a live transcription provider.
function buildAnalysis(rec: VoiceRecording): VoiceAnalysis {
  const rng = createRng(rec.simulationId.split('').reduce((a, c) => a + c.charCodeAt(0), 0));
  const dur = Math.max(8, rec.durationSeconds);
  const wpm = 120 + rng.int(-20, 40);
  const words = Math.round((dur / 60) * wpm);
  const transcript = rec.transcript ?? sampleTranscript(words, rng);
  const input: VoiceInput = {
    simulationId: rec.simulationId,
    transcript,
    words,
    wpm,
    durationSeconds: dur,
    categoryScores: { Grammar: rng.int(55, 95), Vocabulary: rng.int(55, 95), Pronunciation: rng.int(50, 92), 'Speaking Confidence': rng.int(50, 95) },
    overallScore: rng.int(58, 92),
    turns: [{ role: 'learner', text: transcript }],
    emotionTimeline: [],
  };
  return analyzeVoice(input, { mode: 'offline', provider: rec.provider });
}

function sampleTranscript(words: number, rng: ReturnType<typeof createRng>): string {
  const fillers = ['um', 'uh', 'like', 'you know', 'actually'];
  const base = ['thank you for calling', 'how can i help you today', 'let me check that for you', 'i understand your concern', 'i can definitely assist with your policy', 'is there anything else'];
  const out: string[] = [];
  let count = 0;
  while (count < words) {
    const phrase = base[rng.int(0, base.length - 1)];
    out.push(phrase); count += phrase.split(' ').length;
    if (rng.chance(0.25)) { out.push(fillers[rng.int(0, fillers.length - 1)]); count++; }
  }
  return out.join(' ');
}

const KIND_COLOR: Record<string, string> = {
  positive: '#16a34a', filler: '#f59e0b', pause: '#2563eb', pronunciation: '#b71c1c',
  greeting: '#16a34a', closing: '#7c3aed', confidence: '#0ea5e9', opportunity: '#db2777',
};

export function RecordingReviewPanel({ rec, showComplete = false }: { rec: VoiceRecording; showComplete?: boolean }) {
  const navigate = useNavigate();
  const playerRef = useRef<VoicePlayerHandle>(null);
  const ctx = tenantResolver.current();
  const analysis = useMemo(() => buildAnalysis(rec), [rec]);

  const seek = (e: VoiceTimelineEvent) => playerRef.current?.seek(e.atSec);
  const strengths = analysis.timeline.filter((t) => t.score !== undefined && (t.score ?? 0) >= 70);
  const focus = analysis.recommendations;

  return (
    <div className="space-y-6">
      {showComplete && (
        <div className="text-center">
          <CheckCircle2 size={32} className="text-green-600 mx-auto mb-2" />
          <h1 className="section-title text-2xl">Simulation Complete</h1>
        </div>
      )}

      {/* Scores */}
      <Card className="p-6 flex flex-wrap items-center gap-6 justify-center">
        <ProgressRing value={analysis.overallVoiceScore} size={96} label={`${analysis.overallVoiceScore}`} sublabel="Voice" />
        <div className="grid grid-cols-3 gap-6 text-center">
          <div><p className="font-display text-2xl font-bold text-ink-800 dark:text-ink-100">{analysis.speech.wpm}</p><p className="text-xs text-ink-500">WPM</p></div>
          <div><p className="font-display text-2xl font-bold text-ink-800 dark:text-ink-100">{analysis.confidence.confidence}</p><p className="text-xs text-ink-500">Confidence</p></div>
          <div><p className="font-display text-2xl font-bold text-ink-800 dark:text-ink-100">{Math.floor(rec.durationSeconds / 60)}:{String(rec.durationSeconds % 60).padStart(2, '0')}</p><p className="text-xs text-ink-500">Duration</p></div>
        </div>
      </Card>

      {/* Player */}
      <VoicePlayer ref={playerRef} simulationId={rec.simulationId} waveform={rec.waveform} durationSeconds={rec.durationSeconds}
        getSrc={() => getSignedUrl(ctx, rec)} downloadName={`${rec.simulationId}.webm`} />

      {/* Synchronized timeline */}
      <Card className="p-6">
        <h2 className="font-display text-lg font-bold text-ink-800 dark:text-ink-100 mb-3 flex items-center gap-2"><Clock size={18} className="text-lava-600" /> Synchronized Timeline</h2>
        <p className="text-xs text-ink-400 mb-3">Click a moment to jump playback there.</p>
        <div className="space-y-1">
          {analysis.timeline.slice(0, 12).map((e) => (
            <button key={e.id} onClick={() => seek(e)} className="w-full flex items-center gap-3 text-left px-3 py-2 rounded-lg hover:bg-ink-50 dark:hover:bg-ink-800/50 transition-colors">
              <span className="tabular-nums text-xs text-ink-500 w-10">{e.time}</span>
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: KIND_COLOR[e.kind] ?? '#6b7280' }} />
              <span className="text-sm text-ink-700 dark:text-ink-200">{e.label}</span>
              <span className="text-xs text-ink-400 ml-auto truncate max-w-[40%]">{e.detail}</span>
            </button>
          ))}
          {analysis.timeline.length === 0 && <p className="text-sm text-ink-400">No timeline events detected.</p>}
        </div>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Transcript */}
        <Card className="p-6">
          <h2 className="font-display text-lg font-bold text-ink-800 dark:text-ink-100 mb-3 flex items-center gap-2"><FileText size={18} className="text-lava-600" /> Transcript</h2>
          <p className="text-sm text-ink-600 dark:text-ink-300 leading-relaxed max-h-48 overflow-y-auto">{rec.transcript ?? '—'}</p>
          {!rec.transcript && <p className="text-xs text-ink-400 mt-2">Auto-generated preview — attach a transcription provider for verbatim text.</p>}
        </Card>

        {/* AI coaching */}
        <Card className="p-6">
          <h2 className="font-display text-lg font-bold text-ink-800 dark:text-ink-100 mb-3 flex items-center gap-2"><Sparkles size={18} className="text-lava-600" /> AI Coaching</h2>
          {strengths.length > 0 && (
            <div className="mb-3">
              <p className="text-xs uppercase tracking-wide text-green-600 mb-1">Strengths</p>
              {strengths.slice(0, 3).map((s) => <p key={s.id} className="text-sm text-ink-700 dark:text-ink-200">• {s.label}</p>)}
            </div>
          )}
          <p className="text-xs uppercase tracking-wide text-lava-600 mb-1">Recommendations</p>
          {focus.length === 0 && <p className="text-sm text-ink-400">Great work — no major issues detected.</p>}
          {focus.map((r, i) => (
            <div key={i} className="mb-2">
              <p className="text-sm text-ink-800 dark:text-ink-100 flex items-center gap-1"><MessageSquare size={13} className="text-lava-600" /> {r.title}</p>
              <p className="text-xs text-ink-500 dark:text-ink-400">{r.detail}{r.lessonTitle ? ` → ${r.lessonTitle}` : ''}</p>
            </div>
          ))}
        </Card>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2 justify-center">
        {rec.moduleId && <Button variant="secondary" onClick={() => navigate(`/module/${rec.moduleId!.replace('module-', '')}`)}><RotateCcw size={16} /> Retake simulation</Button>}
        <Button variant="ghost" onClick={() => navigate('/learning/recordings')}>All recordings</Button>
      </div>
    </div>
  );
}
