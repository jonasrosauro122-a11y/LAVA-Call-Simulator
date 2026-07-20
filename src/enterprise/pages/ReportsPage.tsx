import { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Download, FileSpreadsheet, FileType } from 'lucide-react';
import { ManagementHeader, PermissionGate, DataTable } from '../components/ManagementComponents';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useManagement } from '../context/ManagementContext';
import { buildReport, exportReport } from '../engines/reportingEngine';
import type { ReportType, ExportFormat } from '../types';

const TYPES: { id: ReportType; label: string }[] = [
  { id: 'team_progress', label: 'Team Progress' },
  { id: 'individual_progress', label: 'Assignment Progress' },
  { id: 'learning_completion', label: 'Learning Completion' },
  { id: 'voice_improvement', label: 'Voice Improvement' },
  { id: 'simulation_results', label: 'Simulation Results' },
  { id: 'certification_status', label: 'Certification Status' },
  { id: 'leaderboard', label: 'Leaderboard' },
  { id: 'attendance', label: 'Attendance' },
];

export function ReportsPage() {
  const { roster, cohorts, assignments } = useManagement();
  const [type, setType] = useState<ReportType>('team_progress');
  const [note, setNote] = useState<string | null>(null);
  const report = buildReport(type, roster, cohorts, assignments);

  const doExport = (format: ExportFormat) => {
    const result = exportReport(report, format);
    if (!result.ready) { setNote(result.note ?? 'Not available yet.'); return; }
    setNote(null);
    const blob = new Blob([result.content], { type: result.mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = result.filename; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <PermissionGate permission="generate_reports">
      <div className="min-h-screen bg-ink-100 dark:bg-ink-950">
        <ManagementHeader />
        <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2">
            <FileText size={22} className="text-lava-600" /><h1 className="section-title text-3xl">Reports</h1>
          </motion.div>

          <div className="flex flex-wrap gap-2">
            {TYPES.map((t) => (
              <button key={t.id} onClick={() => { setType(t.id); setNote(null); }}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${type === t.id ? 'bg-lava-700 text-white' : 'bg-white dark:bg-ink-900 text-ink-600 dark:text-ink-300 hover:bg-ink-50 dark:hover:bg-ink-800'}`}>
                {t.label}
              </button>
            ))}
          </div>

          <Card className="p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="font-display text-lg font-bold text-ink-800 dark:text-ink-100">{report.title}</h2>
                <p className="text-xs text-ink-400">Generated {new Date(report.generatedAt).toLocaleString()}</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => doExport('csv')}><Download size={15} /> CSV</Button>
                <Button size="sm" variant="ghost" onClick={() => doExport('excel')}><FileSpreadsheet size={15} /> Excel</Button>
                <Button size="sm" variant="ghost" onClick={() => doExport('pdf')}><FileType size={15} /> PDF</Button>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 mb-4">
              {report.summary.map((s) => (
                <div key={s.label} className="rounded-xl bg-ink-50 dark:bg-ink-800/50 px-4 py-2">
                  <p className="font-display text-lg font-bold text-ink-800 dark:text-ink-100">{s.value}</p>
                  <p className="text-xs text-ink-500">{s.label}</p>
                </div>
              ))}
            </div>

            {note && <p className="text-sm text-lava-700 dark:text-lava-400 mb-3">{note}</p>}
            <DataTable columns={report.columns} rows={report.rows} />
          </Card>
        </main>
      </div>
    </PermissionGate>
  );
}
