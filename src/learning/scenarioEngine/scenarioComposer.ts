import type { ComposeInput, GeneratedScenario, ScenarioDifficulty } from './types';
import { createRng } from './rng';
import { personalitiesForRole } from './personaLibrary';
import { initialEmotion } from './emotionEngine';
import { pickGoals } from './goalEngine';
import { PHASES } from './conversationStateEngine';
import { directivesFor, DIFFICULTIES } from './difficultyEngine';
import { pickEvents } from './eventEngine';
import { buildScenarioType } from './scenarioLibrary';
import { buildSystemPrompt, buildOpeningLine } from './promptBuilder';

// Weighted difficulty pick — leans toward the middle of the range.
function pickDifficulty(rng: ReturnType<typeof createRng>): ScenarioDifficulty {
  const weights = [0.2, 0.3, 0.25, 0.15, 0.1];
  let r = rng.next();
  for (let i = 0; i < DIFFICULTIES.length; i++) {
    if (r < weights[i]) return DIFFICULTIES[i];
    r -= weights[i];
  }
  return 'Intermediate';
}

// Feature 9 — one call produces a unique, fully-composed scenario.
export function composeScenario(input: ComposeInput): GeneratedScenario {
  const seed = input.seed ?? Math.floor(Math.random() * 1_000_000);
  const rng = createRng(seed);
  const role = input.role;

  const personality = rng.pick(personalitiesForRole(role));
  const emotion = initialEmotion(personality);
  const goals = pickGoals(role, seed + 1);
  const difficulty = input.difficulty ?? pickDifficulty(rng);
  const directives = directivesFor(difficulty);
  const events = pickEvents(rng, directives.objectionFrequency);
  const primaryGoal = goals.find((g) => g.priority === 'primary') ?? goals[0];
  const scenarioType = buildScenarioType(role, primaryGoal, difficulty);

  const parts = {
    role, personality, emotion, goals, scenarioType, difficulty,
    phase: PHASES[0], events,
  };
  const systemPrompt = buildSystemPrompt(parts);
  const openingLine = buildOpeningLine(parts);

  return {
    id: `scn-${seed}`,
    seed,
    role,
    pathId: input.pathId,
    moduleId: input.moduleId,
    scenarioType,
    personality,
    emotion,
    goals,
    difficulty,
    events,
    phases: PHASES,
    expectedSkills: scenarioType.expectedSkills,
    learningObjectives: scenarioType.learningObjectives,
    estimatedMinutes: scenarioType.estimatedMinutes,
    openingLine,
    systemPrompt,
    createdAt: new Date().toISOString(),
  };
}
