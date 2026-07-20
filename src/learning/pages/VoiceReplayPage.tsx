import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Mic, Gauge, Clock, Ear, Timer, Activity, Volume2, MessageSquareText, Sparkles, ListChecks, Waves, ArrowRight, GraduationCap,
} from 'lucide-react';
import { LearningHeader } from '../components/LearningHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { ProgressRing } from '../../components/ui/ProgressRing';
import { SkillBar } from '../analysis/components/AnalysisComponents';
import { TrendChart } from '../analysis/components/TrendChart';
import { VoiceTimeline, LiveCoachFeed, FillerTimeline, StatTile, VoiceProviderBadge } from '../voiceEngine/components/VoiceComponents';
import { useVoice } from '../context/VoiceContext';
import { paceVerdict } from '../voiceEngine/paceAnalyzer';

export function VoiceReplayPage() {
  const { simulationId } = useParams();
  const navigate = useNavigate();
  const { getAnalysis } = useVoice();
  const a = simulationId ? getAnalysis(simulationId) : undefined;

  if (!a) {
    return (
      <div className="min-h-screen bg-ink-100 dark:bg-ink-950">
        <LearningHeader back={{ label: 'Voice Analytics', to: '/learning/voice' }} />
        <main className="max-w-3xl mx-auto px-6 py-16 text-center">
          <p className="text-ink-500 dark:text-ink-400">That voice session could not be found.</p>
          <Button className="mt-4" onClick={() => navigate('/learning/voice')}>Go to Voice Analytics</Button>
        </main>
      </div>
    );
  }

  const paceData = a.pace.map((p) => ({ date: p.label, label: p.label, wpm: p.wpm }));
  const tone = a.toneEnergy;

  return (
    <div className="min-h-screen bg-ink-100 dark:bg-ink-950">
      <LearningHeader back={{ label: 'Voice Analytics', to: '/learning/voice' }} />
      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card-elevated p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-lava-700 dark:text-lava-400 mb-1">
              <Mic size={18} /><span className="text-sm font-semibold uppercase tracking-wide">Voice Replay</span>
            </div>
            <h1 className="font-display text-2xl font-bold text-ink-800 dark:text-ink-100">{a.moduleName}</h1>
            <div className="flex flex-wrap items-center gap-3 mt-3">
              <VoiceProviderBadge provider={a.provider} mode={a.mode} />
              <span className="text-sm text-ink-500 dark:text-ink-400">{new Date(a.createdAt).toLocaleString()}</span>
            </div>
          </div>
          <ProgressRing value={a.overallVoiceScore} size={128} strokeWidth={10} label={`${a.overallVoiceScore}`} sublabel="Voice Score" />
        </motion.div>

        {/* Speech intelligence (Feature 1) */}
        <div>
          <h2 className="section-title mb-3 flex items-center gap-2"><Activity size={20} className="text-lava-600" /> Speech Analytics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <StatTile icon={Gauge} label="Words / min" value={a.speech.wpm} sub={a.speech.speakingSpeed} />
            <StatTile icon={MessageSquareText} label="Avg sentence" value={`${a.speech.avgSentenceLength}w`} />
            <StatTile icon={Timer} label="Avg response" value={`${a.speech.avgResponseTimeSec}s`} />
            <StatTile icon={Clock} label="Thinking time" value={`${a.speech.thinkingTimeSec}s`} />
            <StatTile icon={Ear} label="Listening" value={`${a.speech.listeningRatio}%`} sub={a.speech.conversationBalance} />
            <StatTile icon={Volume2} label="Talk time" value={`${a.speech.talkTimeSec}s`} sub={`AI ${a.speech.aiTalkTimeSec}s`} />
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Confidence (Feature 6) */}
          <Card className="p-6">
            <h2 className="font-display text-lg font-bold text-ink-800 dark:text-ink-100 mb-4">Confidence & Delivery</h2>
            <div className="space-y-3">
              <SkillBar label="Confidence" score={a.confidence.confidence} />
              <SkillBar label="Speech Rhythm" score={a.confidence.speechRhythm} />
              <SkillBar label="Sentence Completion" score={a.confidence.sentenceCompletion} />
              <SkillBar label="Response Certainty" score={a.confidence.responseCertainty} />
              <SkillBar label="Voice Stability" score={a.confidence.voiceStability} />
              <SkillBar label="Professional Presence" score={a.confidence.professionalPresence} />
            </div>
          </Card>

          {/* Tone & energy (Feature 7) */}
          <Card className="p-6">
            <h2 className="font-display text-lg font-bold text-ink-800 dark:text-ink-100 mb-1 flex items-center justify-between">
              Tone & Energy <span className="badge bg-lava-50 dark:bg-lava-950/40 text-lava-700 dark:text-lava-400">{tone.dominantEmotion}</span>
            </h2>
            <div className="grid sm:grid-cols-2 gap-x-6 gap-y-3 mt-3">
              <SkillBar label="Friendly" score={tone.friendly} />
              <SkillBar label="Professional" score={tone.professional} />
              <SkillBar label="Empathetic" score={tone.empathetic} />
              <SkillBar label="Confident" score={tone.confident} />
              <SkillBar label="Assertive" score={tone.assertive} />
              <SkillBar label="Energetic" score={tone.energetic} />
            </div>
          </Card>
        </div>

        {/* Pace graph */}
        <Card className="p-6">
          <h2 className="font-display text-lg font-bold text-ink-800 dark:text-ink-100 mb-1 flex items-center gap-2"><Waves size={20} className="text-lava-600" /> Pace</h2>
          <p className="text-sm text-ink-500 dark:text-ink-400 mb-3">{paceVerdict(a.speech.wpm)}</p>
          <TrendChart data={paceData} metrics={[{ key: 'wpm', color: '#8B0000' }]} height={220} />
        </Card>

        {/* Pronunciation + fillers */}
        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h2 className="font-display text-lg font-bold text-ink-800 dark:text-ink-100 mb-4">Pronunciation</h2>
            <div className="space-y-3">
              <SkillBar label="Overall" score={a.pronunciation.overall} />
              <SkillBar label="Terminology" score={a.pronunciation.terminologyAccuracy} />
              <SkillBar label="Business Vocabulary" score={a.pronunciation.businessVocabulary} />
              <SkillBar label="Carrier Names" score={a.pronunciation.carrierNames} />
            </div>
            {a.pronunciation.detectedTerms.length > 0 && (
              <p className="text-xs text-ink-500 dark:text-ink-400 mt-3">Detected: {a.pronunciation.detectedTerms.slice(0, 8).join(', ')}</p>
            )}
          </Card>
          <Card className="p-6">
            <h2 className="font-display text-lg font-bold text-ink-800 dark:text-ink-100 mb-1">Filler Words</h2>
            <p className="text-sm text-ink-500 dark:text-ink-400 mb-4">{a.fillers.total} total · {a.fillers.perMinute}/min · {a.fillers.frequency}% of words</p>
            <FillerTimeline fillers={a.fillers} durationSeconds={a.durationSeconds} />
          </Card>
        </div>

        {/* Silence + interruptions */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <StatTile icon={Clock} label="Dead air" value={`${a.silence.deadAirSec}s`} />
          <StatTile icon={Clock} label="Long pauses" value={a.silence.longPauses} />
          <StatTile icon={Clock} label="Natural pauses" value={a.silence.naturalPauses} />
          <StatTile icon={Activity} label="Interruptions" value={a.interruptions.totalInterruptions} />
          <StatTile icon={Activity} label="Talk overlap" value={`${a.interruptions.talkOverlapSec}s`} />
          <StatTile icon={Waves} label="Smoothness" value={a.interruptions.smoothness} />
        </div>

        {/* Timeline + live coach */}
        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h2 className="font-display text-lg font-bold text-ink-800 dark:text-ink-100 mb-4 flex items-center gap-2"><ListChecks size={20} className="text-lava-600" /> Conversation Timeline</h2>
            <VoiceTimeline events={a.timeline} />
          </Card>
          <Card className="p-6">
            <h2 className="font-display text-lg font-bold text-ink-800 dark:text-ink-100 mb-4 flex items-center gap-2"><MessageSquareText size={20} className="text-lava-600" /> Live AI Coach</h2>
            <LiveCoachFeed cues={a.liveCues} />
          </Card>
        </div>

        {/* Recommendations */}
        <Card className="p-6">
          <h2 className="font-display text-lg font-bold text-ink-800 dark:text-ink-100 mb-4 flex items-center gap-2"><Sparkles size={20} className="text-lava-600" /> Voice Coaching & Recommended Practice</h2>
          <div className="space-y-3">
            {a.recommendations.map((r, i) => (
              <div key={i} className="flex items-center gap-3 card p-4">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-ink-800 dark:text-ink-100">{r.title}</p>
                  <p className="text-xs text-ink-500 dark:text-ink-400 mt-0.5">{r.detail}</p>
                </div>
                {r.lessonModuleId && (
                  <Button size="sm" variant="secondary" onClick={() => navigate(`/learning/module/${r.lessonModuleId}`)}>
                    <GraduationCap size={15} /> {r.lessonTitle ?? 'Lesson'}
                  </Button>
                )}
              </div>
            ))}
          </div>
          <div className="mt-4">
            <Button variant="ghost" onClick={() => navigate(`/learning/simulation/${a.simulationId}`)}>
              View full communication analysis <ArrowRight size={15} />
            </Button>
          </div>
        </Card>
      </main>
    </div>
  );
}
