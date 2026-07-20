import { useState } from 'react';
import { motion } from 'framer-motion';
import { ClipboardList, Plus } from 'lucide-react';
import { ManagementHeader, PermissionGate, DataTable, ProgressBar } from '../components/ManagementComponents';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useManagement } from '../context/ManagementContext';
import { createAssignment, computeAssignmentProgress } from '../engines/assignmentEngine';
import type { AssignmentType, Priority, Difficulty } from '../types';

export function AssignmentsPage() {
  const { assignments, roster, cohorts, addAssignment, can } = useManagement();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [type, setType] = useState<AssignmentType>('path');
  const [cohortId, setCohortId] = useState(cohorts[0]?.id ?? '');
  const [dueInDays, setDue] = useState(7);
  const [priority, setPriority] = useState<Priority>('medium');
  const [difficulty, setDifficulty] = useState<Difficulty>('Intermediate');

  const rows = assignments.map((a) => computeAssignmentProgress(a, roster));

  const submit = () => {
    if (!title.trim()) return;
    const cohort = cohorts.find((c) => c.id === cohortId);
    addAssignment(createAssignment({
      title: title.trim(), type, targetId: type, assignerId: 'me',
      learnerIds: cohort?.memberIds ?? [], cohortId: cohortId || null, dueInDays, priority, difficulty,
    }));
    setTitle(''); setOpen(false);
  };

  return (
    <PermissionGate permission="view_assignments">
      <div className="min-h-screen bg-ink-100 dark:bg-ink-950">
        <ManagementHeader />
        <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
            <div className="flex items-center gap-2"><ClipboardList size={22} className="text-lava-600" /><h1 className="section-title text-3xl">Assignments</h1></div>
            {can('assign_content') && <Button onClick={() => setOpen((v) => !v)}><Plus size={16} /> New assignment</Button>}
          </motion.div>

          {open && (
            <Card className="p-5">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Assignment title…" className="px-3 py-2 rounded-lg border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-900 text-sm text-ink-700 dark:text-ink-200 lg:col-span-3" />
                <select value={type} onChange={(e) => setType(e.target.value as AssignmentType)} className="px-3 py-2 rounded-lg border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-900 text-sm text-ink-700 dark:text-ink-200">
                  {(['path', 'module', 'simulation', 'quiz', 'voice'] as AssignmentType[]).map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                <select value={cohortId} onChange={(e) => setCohortId(e.target.value)} className="px-3 py-2 rounded-lg border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-900 text-sm text-ink-700 dark:text-ink-200">
                  {cohorts.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <select value={priority} onChange={(e) => setPriority(e.target.value as Priority)} className="px-3 py-2 rounded-lg border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-900 text-sm text-ink-700 dark:text-ink-200">
                  {(['low', 'medium', 'high'] as Priority[]).map((p) => <option key={p} value={p}>{p} priority</option>)}
                </select>
                <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as Difficulty)} className="px-3 py-2 rounded-lg border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-900 text-sm text-ink-700 dark:text-ink-200">
                  {(['Beginner', 'Intermediate', 'Advanced'] as Difficulty[]).map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
                <input type="number" value={dueInDays} onChange={(e) => setDue(Number(e.target.value))} min={1} className="px-3 py-2 rounded-lg border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-900 text-sm text-ink-700 dark:text-ink-200" placeholder="Due in days" />
                <Button onClick={submit}>Create</Button>
              </div>
            </Card>
          )}

          <Card className="p-4">
            <DataTable
              columns={['Assignment', 'Type', 'Priority', 'Difficulty', 'Due', 'Completion', 'Status']}
              rows={rows.map((w) => [
                w.assignment.title,
                w.assignment.type,
                w.assignment.priority,
                w.assignment.difficulty,
                new Date(w.assignment.dueAt).toLocaleDateString(),
                <div className="w-28"><ProgressBar value={w.completionRate} /><span className="text-xs text-ink-400">{w.completed}/{w.total}</span></div>,
                w.overdue ? <span className="badge bg-red-50 dark:bg-red-900/20 text-red-600">Overdue</span> : <span className="badge bg-green-50 dark:bg-green-900/20 text-green-600">Active</span>,
              ])}
            />
          </Card>
        </main>
      </div>
    </PermissionGate>
  );
}
