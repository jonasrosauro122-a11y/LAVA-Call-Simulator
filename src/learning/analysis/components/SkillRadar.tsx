import { RadarChart as RRadar, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import type { RadarAxis } from '../types';

interface SkillRadarProps {
  axes: RadarAxis[];
  height?: number;
}

// Reuses recharts with the existing lava accent, matching ReportPage's radar.
export function SkillRadar({ axes, height = 320 }: SkillRadarProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RRadar data={axes}>
        <PolarGrid className="stroke-ink-200 dark:stroke-ink-700" />
        <PolarAngleAxis dataKey="skill" tick={{ fontSize: 11, fill: 'currentColor' }} className="text-ink-500 dark:text-ink-400" />
        <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
        <Radar dataKey="score" stroke="#8B0000" fill="#8B0000" fillOpacity={0.3} strokeWidth={2} />
      </RRadar>
    </ResponsiveContainer>
  );
}
