import {
  Sprout, GraduationCap, UserCheck, Briefcase, Target, Star, Award, Medal, Flame, Crown, Trophy, type LucideIcon,
} from 'lucide-react';
import type { Rank } from '../lib/rankEngine';

const RANK_ICONS: Record<string, LucideIcon> = {
  Sprout, GraduationCap, UserCheck, Briefcase, Target, Star, Award, Medal, Flame, Crown, Trophy,
};

interface RankBadgeProps {
  rank: Rank;
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
}

export function RankBadge({ rank, size = 'md', showName = true }: RankBadgeProps) {
  const Icon = RANK_ICONS[rank.icon] ?? Star;
  const dims = { sm: 24, md: 32, lg: 44 }[size];
  const icon = { sm: 13, md: 17, lg: 24 }[size];
  return (
    <div className="flex items-center gap-2">
      <div
        className="rounded-xl flex items-center justify-center text-white shadow-soft shrink-0"
        style={{ width: dims, height: dims, background: rank.color }}
      >
        <Icon size={icon} />
      </div>
      {showName && (
        <span className="font-display font-bold text-ink-800 dark:text-ink-100" style={{ color: undefined }}>
          {rank.name}
        </span>
      )}
    </div>
  );
}
