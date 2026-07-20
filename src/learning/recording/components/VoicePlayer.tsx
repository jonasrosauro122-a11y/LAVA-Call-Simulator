import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Play, Pause, Square, Download, Loader2, AlertTriangle } from 'lucide-react';
import { markPlayed, markDownloaded } from '../voiceRecordingApi';

export interface VoicePlayerHandle { seek: (sec: number) => void; }

interface Props {
  getSrc: () => Promise<string | null>;
  durationSeconds?: number;
  waveform?: number[];
  simulationId?: string;
  onTime?: (sec: number) => void;
  allowDownload?: boolean;
  downloadName?: string;
}

const SPEEDS = [0.75, 1, 1.25, 1.5, 2];

function fmt(sec: number): string {
  if (!isFinite(sec) || sec < 0) return '0:00';
  const m = Math.floor(sec / 60); const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

// Reusable audio player: play/pause/stop, seek, timeline, speed, waveform, current/remaining
// time, loading + error states, and lazy signed-URL loading with refresh on failure.
export const VoicePlayer = forwardRef<VoicePlayerHandle, Props>(function VoicePlayer(
  { getSrc, durationSeconds = 0, waveform = [], simulationId, onTime, allowDownload = true, downloadName = 'recording.webm' }, ref,
) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [src, setSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(durationSeconds);
  const [speed, setSpeed] = useState(1);

  const ensureSrc = async (): Promise<string | null> => {
    if (src) return src;
    setLoading(true); setError(null);
    try {
      const url = await getSrc();
      if (!url) { setError('Recording unavailable'); return null; }
      setSrc(url); return url;
    } catch { setError('Could not load recording'); return null; }
    finally { setLoading(false); }
  };

  useImperativeHandle(ref, () => ({
    seek: (sec: number) => { void seekTo(sec); },
  }));

  const seekTo = async (sec: number) => {
    const url = await ensureSrc();
    if (!url || !audioRef.current) return;
    audioRef.current.currentTime = sec;
    if (!playing) { try { await audioRef.current.play(); setPlaying(true); } catch { /* ignore */ } }
  };

  const toggle = async () => {
    const url = await ensureSrc();
    if (!url || !audioRef.current) return;
    if (playing) { audioRef.current.pause(); setPlaying(false); }
    else {
      try { await audioRef.current.play(); setPlaying(true); if (simulationId) markPlayed(simulationId); }
      catch { setError('Playback blocked — tap play again'); }
    }
  };

  const stop = () => { if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; setPlaying(false); setCurrent(0); } };

  const changeSpeed = () => {
    const nextIndex = (SPEEDS.indexOf(speed) + 1) % SPEEDS.length;
    const next = SPEEDS[nextIndex]; setSpeed(next);
    if (audioRef.current) audioRef.current.playbackRate = next;
  };

  const download = async () => {
    const url = await ensureSrc(); if (!url) return;
    const a = document.createElement('a'); a.href = url; a.download = downloadName; a.click();
    if (simulationId) markDownloaded(simulationId);
  };

  useEffect(() => {
    const el = audioRef.current; if (!el) return;
    const onTimeUpdate = () => { setCurrent(el.currentTime); onTime?.(el.currentTime); };
    const onLoaded = () => { if (isFinite(el.duration)) setDuration(el.duration); };
    const onEnd = () => { setPlaying(false); setCurrent(0); };
    const onErr = () => { setError('Recording failed to load'); setSrc(null); };
    el.addEventListener('timeupdate', onTimeUpdate);
    el.addEventListener('loadedmetadata', onLoaded);
    el.addEventListener('ended', onEnd);
    el.addEventListener('error', onErr);
    return () => { el.removeEventListener('timeupdate', onTimeUpdate); el.removeEventListener('loadedmetadata', onLoaded); el.removeEventListener('ended', onEnd); el.removeEventListener('error', onErr); };
  }, [onTime]);

  const pct = duration > 0 ? (current / duration) * 100 : 0;

  return (
    <div className="rounded-xl border border-ink-100 dark:border-ink-800 bg-white dark:bg-ink-900 p-4">
      <audio ref={audioRef} src={src ?? undefined} preload="none" />
      {error && <div className="text-xs text-lava-600 mb-2 flex items-center gap-1"><AlertTriangle size={13} /> {error}</div>}

      {/* Waveform */}
      <div className="flex items-end gap-0.5 h-12 mb-3" aria-hidden>
        {(waveform.length ? waveform : Array.from({ length: 60 }, () => 0.15)).slice(0, 80).map((v, i, arr) => {
          const played = (i / arr.length) * 100 <= pct;
          return <div key={i} className="flex-1 rounded-sm" style={{ height: `${Math.max(6, v * 100)}%`, background: played ? '#8B0000' : 'rgba(139,0,0,0.25)' }} />;
        })}
      </div>

      {/* Seek */}
      <input type="range" min={0} max={duration || 0} step={0.1} value={current}
        onChange={(e) => seekTo(Number(e.target.value))}
        className="w-full accent-lava-600" aria-label="Seek" />
      <div className="flex justify-between text-xs text-ink-400 mt-1"><span>{fmt(current)}</span><span>-{fmt(Math.max(0, duration - current))}</span></div>

      {/* Controls */}
      <div className="flex items-center gap-2 mt-3">
        <button onClick={toggle} className="btn-primary text-sm" aria-label={playing ? 'Pause' : 'Play'}>
          {loading ? <Loader2 size={16} className="animate-spin" /> : playing ? <Pause size={16} /> : <Play size={16} />}
          {playing ? 'Pause' : 'Play'}
        </button>
        <button onClick={stop} className="btn-ghost text-sm" aria-label="Stop"><Square size={15} /></button>
        <button onClick={changeSpeed} className="btn-ghost text-sm tabular-nums" aria-label="Playback speed">{speed}x</button>
        {allowDownload && <button onClick={download} className="btn-ghost text-sm ml-auto" aria-label="Download"><Download size={15} /> Download</button>}
      </div>
    </div>
  );
});
