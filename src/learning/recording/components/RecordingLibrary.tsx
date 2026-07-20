import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Disc3, Play, Download, Trash2, Database, HardDrive, Clock, AlertTriangle } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { LoadingState, EmptyState, ErrorState } from '../../../production/components/StateViews';
import { StatCard, DataTable } from '../../../enterprise/components/ManagementComponents';
import { listRecordings, deleteRecording, getSignedUrl, markDownloaded, storageStats, canAccessRecording } from '../voiceRecordingApi';
import { tenantResolver } from '../../../tenant/tenantResolver';
import type { VoiceRecording, StorageStats } from '../types';
import type { Role } from '../../../enterprise/types';

function fmtDur(s: number): string { return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`; }
function fmtBytes(b: number): string { return b >= 1e6 ? `${(b / 1e6).toFixed(1)} MB` : `${(b / 1e3).toFixed(0)} KB`; }

// Reusable recording library for both the learner's own page and the trainer's learner
// profile. Enforces canAccessRecording for the viewer.
export function RecordingLibrary({ learnerId, viewerRole, viewerLearnerId, canDelete = false }: {
  learnerId?: string; viewerRole: Role; viewerLearnerId: string; canDelete?: boolean;
}) {
  const navigate = useNavigate();
  const ctx = tenantResolver.current();
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [rows, setRows] = useState<VoiceRecording[]>([]);

  const load = () => {
    setState('loading');
    listRecordings(ctx, { learnerId })
      .then((r) => { setRows(r.filter((rec) => canAccessRecording(viewerRole, rec.learnerId, viewerLearnerId))); setState('ready'); })
      .catch(() => setState('error'));
  };
  useEffect(load, [learnerId]); // eslint-disable-line react-hooks/exhaustive-deps

  const download = async (rec: VoiceRecording) => {
    const url = await getSignedUrl(ctx, rec); if (!url) return;
    const a = document.createElement('a'); a.href = url; a.download = `${rec.simulationId}.webm`; a.click();
    markDownloaded(rec.simulationId);
  };
  const remove = async (rec: VoiceRecording) => { await deleteRecording(ctx, rec); load(); };

  if (state === 'loading') return <LoadingState label="Loading recordings…" />;
  if (state === 'error') return <ErrorState message="Could not load recordings" onRetry={load} />;
  if (rows.length === 0) return <EmptyState title="No recordings yet" message="Recordings from AI simulations will appear here." icon={<Disc3 size={28} />} />;

  return (
    <DataTable
      columns={['Date', 'Module', 'Duration', 'Size', 'Actions']}
      rows={rows.map((rec) => [
        new Date(rec.createdAt).toLocaleDateString(),
        rec.moduleId?.replace('module-', 'Module ') ?? '—',
        fmtDur(rec.durationSeconds),
        fmtBytes(rec.fileSize),
        <span className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button className="btn-ghost text-xs" title="Review" onClick={() => navigate(`/learning/recording/${rec.simulationId}`)}><Play size={14} /></button>
          <button className="btn-ghost text-xs" title="Download" onClick={() => void download(rec)}><Download size={14} /></button>
          {canDelete && <button className="btn-ghost text-xs text-red-600" title="Delete" onClick={() => void remove(rec)}><Trash2 size={14} /></button>}
        </span>,
      ])}
    />
  );
}

// Admin storage summary (Platform dashboard).
export function RecordingsAdmin() {
  const [stats, setStats] = useState<StorageStats | null>(null);
  useEffect(() => { void storageStats().then(setStats); }, []);
  if (!stats) return <LoadingState label="Loading storage stats…" />;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={Disc3} label="Total recordings" value={stats.totalRecordings} />
        <StatCard icon={HardDrive} label="Storage used" value={fmtBytes(stats.totalBytes)} accent="#2563eb" />
        <StatCard icon={Clock} label="Avg duration" value={fmtDur(stats.avgDurationSeconds)} accent="#7c3aed" />
        <StatCard icon={AlertTriangle} label="Upload failures" value={stats.uploadFailures} accent="#b71c1c" />
      </div>
      <Card className="p-6">
        <h3 className="font-display font-bold text-ink-800 dark:text-ink-100 mb-3 flex items-center gap-2"><Database size={18} className="text-lava-600" /> Storage per Tenant</h3>
        {stats.perTenant.length === 0
          ? <EmptyState title="No recordings stored yet" />
          : <DataTable columns={['Tenant', 'Recordings', 'Storage']} rows={stats.perTenant.map((t) => [t.tenantId, t.recordings, fmtBytes(t.bytes)])} />}
      </Card>
    </div>
  );
}
