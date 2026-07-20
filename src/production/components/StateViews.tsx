import { motion } from 'framer-motion';
import { Loader2, AlertTriangle, Inbox, RefreshCw, WifiOff } from 'lucide-react';
import { Button } from '../../components/ui/Button';

// Professional, reusable async-state views (Phase 9). Accessible (aria-live / role) and
// on-brand. Used across new pages and available to any existing page.

export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-ink-500 dark:text-ink-400" role="status" aria-live="polite">
      <Loader2 className="animate-spin text-lava-600 mb-3" size={28} />
      <p className="text-sm">{label}</p>
    </div>
  );
}

export function ErrorState({ title = 'Something went wrong', message, onRetry }: { title?: string; message?: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center" role="alert">
      <AlertTriangle className="text-lava-600 mb-3" size={28} />
      <h3 className="font-display font-bold text-ink-800 dark:text-ink-100">{title}</h3>
      {message && <p className="text-sm text-ink-500 dark:text-ink-400 mt-1 max-w-md">{message}</p>}
      {onRetry && <Button size="sm" variant="secondary" className="mt-4" onClick={onRetry}><RefreshCw size={14} /> Try again</Button>}
    </div>
  );
}

export function EmptyState({ title = 'Nothing here yet', message, icon }: { title?: string; message?: string; icon?: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-ink-300 dark:text-ink-600 mb-3">{icon ?? <Inbox size={28} />}</div>
      <h3 className="font-display font-bold text-ink-700 dark:text-ink-200">{title}</h3>
      {message && <p className="text-sm text-ink-500 dark:text-ink-400 mt-1 max-w-md">{message}</p>}
    </motion.div>
  );
}

export function OfflineBanner({ online }: { online: boolean }) {
  if (online) return null;
  return (
    <div className="bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-sm px-4 py-2 flex items-center justify-center gap-2" role="status">
      <WifiOff size={15} /> You're offline — changes are kept locally and will sync when reconnected.
    </div>
  );
}
