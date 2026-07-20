import { uid, nowIso } from './types';
import { jobQueue } from './jobQueue';

export interface ScheduledTask {
  id: string;
  name: string;
  cron: string; // "min hour dom mon dow"
  enabled: boolean;
  jobType?: string;
  handler?: () => void | Promise<void>;
  lastRun?: string;
  nextRun: string;
}

// Minimal cron field matcher: supports "*", exact numbers, and "*/n" steps.
function fieldMatches(field: string, value: number): boolean {
  if (field === '*') return true;
  if (field.startsWith('*/')) { const step = parseInt(field.slice(2), 10); return step > 0 && value % step === 0; }
  return field.split(',').some((p) => parseInt(p, 10) === value);
}

export function cronMatches(cron: string, date: Date): boolean {
  const [min, hour, dom, mon, dow] = cron.trim().split(/\s+/);
  if (!min || !hour || !dom || !mon || !dow) return false;
  return fieldMatches(min, date.getUTCMinutes())
    && fieldMatches(hour, date.getUTCHours())
    && fieldMatches(dom, date.getUTCDate())
    && fieldMatches(mon, date.getUTCMonth() + 1)
    && fieldMatches(dow, date.getUTCDay());
}

// Scan forward minute-by-minute (bounded) to find the next matching time.
export function computeNextRun(cron: string, from: Date = new Date()): string {
  const d = new Date(from.getTime());
  d.setUTCSeconds(0, 0);
  d.setUTCMinutes(d.getUTCMinutes() + 1);
  for (let i = 0; i < 366 * 24 * 60; i++) {
    if (cronMatches(cron, d)) return d.toISOString();
    d.setUTCMinutes(d.getUTCMinutes() + 1);
  }
  return d.toISOString();
}

/**
 * Scheduler — cron-like recurring tasks. Each task either enqueues a background job
 * or invokes a handler when due. tick() is called periodically (or manually in tests);
 * it fires due tasks and recomputes the next run.
 */
class Scheduler {
  private tasks = new Map<string, ScheduledTask>();

  schedule(name: string, cron: string, action: { jobType?: string; handler?: () => void | Promise<void> }): ScheduledTask {
    const task: ScheduledTask = {
      id: uid('task'), name, cron, enabled: true,
      jobType: action.jobType, handler: action.handler, nextRun: computeNextRun(cron),
    };
    this.tasks.set(task.id, task);
    return task;
  }

  async tick(now: Date = new Date()): Promise<void> {
    for (const task of this.tasks.values()) {
      if (!task.enabled) continue;
      if (new Date(task.nextRun).getTime() <= now.getTime()) {
        task.lastRun = nowIso();
        task.nextRun = computeNextRun(task.cron, now);
        if (task.jobType) jobQueue.enqueue(task.jobType, { scheduledBy: task.name });
        if (task.handler) { try { await task.handler(); } catch (err) { console.warn('[Scheduler] task failed', task.name, err); } }
      }
    }
  }

  setEnabled(id: string, on: boolean): void { const t = this.tasks.get(id); if (t) t.enabled = on; }
  list(): ScheduledTask[] { return [...this.tasks.values()]; }
}

export const scheduler = new Scheduler();
