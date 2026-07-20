import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Disc3 } from 'lucide-react';
import { LearningHeader } from '../../components/LearningHeader';
import { Button } from '../../../components/ui/Button';
import { LoadingState, ErrorState } from '../../../production/components/StateViews';
import { RecordingReviewPanel } from '../components/RecordingReviewPanel';
import { RecordingLibrary } from '../components/RecordingLibrary';
import { getRecording } from '../voiceRecordingApi';
import { tenantResolver } from '../../../tenant/tenantResolver';
import { useRecordingContext } from '../context/RecordingProvider';
import { useManagement } from '../../../enterprise/context/ManagementContext';
import type { VoiceRecording } from '../types';

export function RecordingReviewPage() {
  const { simulationId } = useParams();
  const navigate = useNavigate();
  const [state, setState] = useState<'loading' | 'ready' | 'missing'>('loading');
  const [rec, setRec] = useState<VoiceRecording | null>(null);

  useEffect(() => {
    if (!simulationId) { setState('missing'); return; }
    getRecording(tenantResolver.current(), simulationId)
      .then((r) => { if (r) { setRec(r); setState('ready'); } else setState('missing'); })
      .catch(() => setState('missing'));
  }, [simulationId]);

  return (
    <div className="min-h-screen bg-ink-100 dark:bg-ink-950">
      <LearningHeader back={{ label: 'My Recordings', to: '/learning/recordings' }} />
      <main className="max-w-4xl mx-auto px-6 py-8">
        {state === 'loading' && <LoadingState label="Loading recording…" />}
        {state === 'missing' && <ErrorState title="Recording not found" message="It may still be uploading, or it was removed." onRetry={() => navigate('/learning/recordings')} />}
        {state === 'ready' && rec && <RecordingReviewPanel rec={rec} showComplete />}
      </main>
    </div>
  );
}

export function RecordingLibraryPage() {
  const { learnerId } = useRecordingContext();
  const { role } = useManagement();
  return (
    <div className="min-h-screen bg-ink-100 dark:bg-ink-950">
      <LearningHeader back={{ label: 'Learning', to: '/learning' }} />
      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        <div className="flex items-center gap-2">
          <Disc3 size={22} className="text-lava-600" />
          <h1 className="section-title text-3xl">My Recordings</h1>
        </div>
        <div className="card p-4">
          <RecordingLibrary learnerId={learnerId} viewerRole={role} viewerLearnerId={learnerId} canDelete />
        </div>
        <Button variant="ghost" onClick={() => history.back()}>Back</Button>
      </main>
    </div>
  );
}
