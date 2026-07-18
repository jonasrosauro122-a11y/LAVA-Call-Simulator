import { Award, Lock } from 'lucide-react';

interface CertificateCardProps {
  pathTitle: string;
  candidateName?: string;
  score?: number;
  issuedAt?: string | null;
  earned: boolean;
}

// Certificate visual reused for both earned certificates and locked previews.
export function CertificateCard({ pathTitle, candidateName, score, issuedAt, earned }: CertificateCardProps) {
  return (
    <div className={`rounded-2xl border p-5 relative overflow-hidden ${
      earned
        ? 'border-lava-200 dark:border-lava-900/60 bg-gradient-to-br from-lava-50 to-white dark:from-lava-950/30 dark:to-ink-900'
        : 'border-ink-200/60 dark:border-ink-800 bg-ink-50 dark:bg-ink-800/40'
    }`}>
      <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-lava-700/5 blur-2xl" />
      <div className="relative flex items-center gap-3">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
          earned ? 'gradient-lava text-white' : 'bg-ink-200 dark:bg-ink-700 text-ink-400'
        }`}>
          {earned ? <Award size={22} /> : <Lock size={20} />}
        </div>
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-wide font-semibold text-lava-700 dark:text-lava-400">
            Certificate of Completion
          </p>
          <h4 className="font-display font-bold text-ink-800 dark:text-ink-100 truncate">{pathTitle}</h4>
          {earned ? (
            <p className="text-xs text-ink-500 dark:text-ink-400">
              {candidateName ? `${candidateName} • ` : ''}Score {score}/100
              {issuedAt ? ` • ${new Date(issuedAt).toLocaleDateString()}` : ''}
            </p>
          ) : (
            <p className="text-xs text-ink-500 dark:text-ink-400">Complete every module to unlock your certificate.</p>
          )}
        </div>
      </div>
    </div>
  );
}
