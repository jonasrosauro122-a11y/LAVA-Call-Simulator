import { uid, nowIso } from './types';
import { eventBus } from './eventBus';

export type JobStatus = 'queued' | 'running' | 'completed' | 'failed' | 'scheduled';

export interface Job<T = unknown> {
  id: string;
  type: string;
  status: JobStatus;
  payload: T;
  attempts: number;
  maxAttempts: number;
  createdAt: string;
  runAt: string;
  startedAt?: string;
  finishedAt?: string;
  error?: string;
  result?: unknown;
}

export type JobRunner<T = unknown> = (job: Job<T>) => Promise<unknown>;

/**
 * JobQueue — a background processing framework. Runners are registered by job type;
 * enqueued jobs move queued → running → completed | failed with retry, and support
 * scheduled (future runAt) execution. Emits JobCompleted / JobFailed on the bus.
 * Processing is cooperative (tick-based) so it works in the browser and can later be
 * swapped for a server worker without changing callers.
 */
class JobQueue {
  private runners = new Map<string, JobRunner>();
  private jobs: Job[] = [];
  private timer: ReturnType<typeof setInterval> | null = null;

  register<T = unknown>(type: string, runner: JobRunner<T>): void {
    this.runners.set(type, runner as JobRunner);
  }

  enqueue<T = unknown>(type: string, payload: T, opts: { maxAttempts?: number; runAt?: string } = {}): Job<T> {
    const runAt = opts.runAt ?? nowIso();
    const job: Job<T> = {
      id: uid('job'), type, status: new Date(runAt).getTime() > Date.now() ? 'scheduled' : 'queued',
      payload, attempts: 0, maxAttempts: opts.maxAttempts ?? 3, createdAt: nowIso(), runAt,
    };
    this.jobs.push(job);
    queueMicrotask(() => void this.tick());
    return job;
  }

  async tick(): Promise<void> {
    const now = Date.now();
    for (const job of this.jobs) {
      if ((job.status === 'queued' || job.status === 'scheduled') && new Date(job.runAt).getTime() <= now) {
        await this.run(job);
      }
    }
  }

  private async run(job: Job): Promise<void> {
    const runner = this.runners.get(job.type);
    if (!runner) { job.status = 'failed'; job.error = 'no runner registered'; return; }
    job.status = 'running'; job.startedAt = nowIso(); job.attempts++;
    try {
      job.result = await runner(job);
      job.status = 'completed'; job.finishedAt = nowIso();
      void eventBus.publish('JobCompleted', { id: job.id, type: job.type }, { source: 'jobQueue' });
    } catch (err) {
      job.error = err instanceof Error ? err.message : String(err);
      if (job.attempts < job.maxAttempts) { job.status = 'queued'; }
      else {
        job.status = 'failed'; job.finishedAt = nowIso();
        void eventBus.publish('JobFailed', { id: job.id, type: job.type, error: job.error }, { source: 'jobQueue' });
      }
    }
  }

  start(intervalMs = 5000): void {
    if (this.timer) return;
    this.timer = setInterval(() => void this.tick(), intervalMs);
  }
  stop(): void { if (this.timer) { clearInterval(this.timer); this.timer = null; } }

  list(status?: JobStatus): Job[] {
    const all = [...this.jobs].reverse();
    return status ? all.filter((j) => j.status === status) : all;
  }
  get(id: string): Job | undefined { return this.jobs.find((j) => j.id === id); }
  registeredTypes(): string[] { return [...this.runners.keys()]; }
}

export const jobQueue = new JobQueue();
