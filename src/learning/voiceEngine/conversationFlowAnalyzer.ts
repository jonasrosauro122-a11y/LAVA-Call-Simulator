import type { InterruptionReport, SilenceReport, FillerReport } from './types';
import { clamp } from './extract';

// Overall conversational smoothness from interruptions, dead air, and fillers.
export function analyzeConversationFlow(
  interruptions: InterruptionReport,
  silence: SilenceReport,
  fillers: FillerReport,
): number {
  return clamp(
    interruptions.smoothness * 0.5
    + (100 - Math.min(100, silence.deadAirSec * 4)) * 0.25
    + (100 - Math.min(100, fillers.perMinute * 8)) * 0.25,
  );
}
