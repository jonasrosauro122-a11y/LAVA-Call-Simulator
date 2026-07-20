import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Rocket, CheckCircle2, AlertTriangle, XCircle, RefreshCw, Activity } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { ProgressRing } from '../../components/ui/ProgressRing';
import { PermissionGate } from '../../enterprise/components/ManagementComponents';
import { checklistEngine, type ChecklistResult, type CheckStatus } from '../checklistEngine';
import { environment } from '../environment';

const STATUS_ICON: Record<CheckStatus, React.ReactNode> = {
  pass: <CheckCircle2 size={16} className="text-green-600" />,
  warn: <AlertTriangle size={16} className="text-amber-500" />,
  fail: <XCircle size={16} className="text-red-600" />,
};

export function LaunchCenterPage() {
  const navigate = useNavigate();
  const [result, setResult] = useState<ChecklistResult>(() => checklistEngine.run());
  const [running, setRunning] = useState(false);

  const run = () => {
    setRunning(true);
    setTimeout(() => { setResult(checklistEngine.run()); setRunning(false); }, 400);
  };

  const categories = [...new Set(result.items.map((i) => i.category))];
  const ringColor = result.summary.fail > 0 ? '#b71c1c' : result.summary.warn > 0 ? '#f59e0b' : '#16a34a';

  return (
    <PermissionGate permission="manage_roles">
      <div className="min-h-screen bg-ink-100 dark:bg-ink-950">
        <header className="sticky top-0 z-30 bg-white/80 dark:bg-ink-900/80 backdrop-blur border-b border-ink-100 dark:border-ink-800">
          <div className="max-w-6xl mx-auto px-6 h-16 flex items-center gap-4">
            <button onClick={() => navigate('/admin/platform')} className="btn-ghost text-sm"><ArrowLeft size={16} /> Platform</button>
            <span className="font-display font-bold text-lava-700 dark:text-lava-400">Launch Center</span>
            <button onClick={() => navigate('/admin/health')} className="btn-ghost text-sm ml-2"><Activity size={15} /> Health</button>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card-elevated p-6 flex flex-col md:flex-row items-center gap-6">
            <ProgressRing value={result.readiness} size={120} label={`${result.readiness}%`} sublabel="Ready" color={ringColor} />
            <div className="flex-1 text-center md:text-left">
              <h1 className="section-title text-2xl flex items-center gap-2 justify-center md:justify-start"><Rocket size={22} className="text-lava-600" /> Production Readiness</h1>
              <p className="text-ink-600 dark:text-ink-300 mt-1">{result.verdict}</p>
              <p className="text-sm text-ink-400 mt-1">Environment: <span className="font-mono">{environment.current()}</span> · {result.summary.pass} pass · {result.summary.warn} warn · {result.summary.fail} fail</p>
            </div>
            <Button onClick={run} disabled={running}><RefreshCw size={16} className={running ? 'animate-spin' : ''} /> {running ? 'Verifying…' : 'Run verification'}</Button>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-4">
            {categories.map((cat) => (
              <Card key={cat} className="p-5">
                <h2 className="font-display font-bold text-ink-800 dark:text-ink-100 mb-3">{cat}</h2>
                <div className="space-y-2">
                  {result.items.filter((i) => i.category === cat).map((i) => (
                    <div key={i.id} className="flex items-start gap-2 text-sm">
                      <span className="mt-0.5 shrink-0">{STATUS_ICON[i.status]}</span>
                      <div>
                        <p className="text-ink-800 dark:text-ink-100">{i.label}</p>
                        <p className="text-xs text-ink-500 dark:text-ink-400">{i.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </main>
      </div>
    </PermissionGate>
  );
}
