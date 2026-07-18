import type {
  GeneratedScenario, ConversationMemoryData, ConversationStateData, Emotion, RandomEvent, EmotionTrigger, ScenarioDifficulty,
} from './types';
import { createMemory, addTurn, memoryBriefing } from './memoryEngine';
import { createState, advance } from './conversationStateEngine';
import { transition } from './emotionEngine';
import { directivesFor, adapt, type DifficultyDirectives } from './difficultyEngine';
import { maybeInject } from './eventEngine';
import { createRng, type Rng } from './rng';
import { buildSystemPrompt } from './promptBuilder';
import { aiService } from '../ai';

export interface LocalTurn {
  text: string;
  emotion: Emotion;
  phase: ConversationStateData['phase'];
  event: RandomEvent | null;
}

// A live, reusable runtime for one simulation. Not wired into the (unchanged)
// simulator UI — it is the reusable substrate a future dynamic simulator will use.
export class SimulationRuntime {
  scenario: GeneratedScenario;
  memory: ConversationMemoryData = createMemory();
  state: ConversationStateData = createState();
  emotion: Emotion;
  difficulty: ScenarioDifficulty;
  directives: DifficultyDirectives;
  private rng: Rng;

  constructor(scenario: GeneratedScenario) {
    // Assign scenario-dependent fields inside the constructor body so they are set
    // after `scenario` — class field initializers run before parameter assignment
    // when useDefineForClassFields is enabled (Vite/modern targets).
    this.scenario = scenario;
    this.emotion = scenario.emotion;
    this.difficulty = scenario.difficulty;
    this.directives = directivesFor(scenario.difficulty);
    this.rng = createRng(scenario.seed + this.state.turn + 1);
  }

  // Deterministic, offline turn — updates memory/state/emotion and returns a reply.
  localTurn(learnerText: string, signal: EmotionTrigger): LocalTurn {
    this.memory = addTurn(this.memory, 'learner', learnerText, this.state.phase);
    this.emotion = transition(this.emotion, signal, this.scenario.personality);
    this.state = advance(this.state);
    this.rng = createRng(this.scenario.seed + this.state.turn + 1);
    const event = maybeInject(this.rng, this.directives.objectionFrequency, this.scenario.events);

    const text = this.replyText();
    this.memory = addTurn(this.memory, 'ai', text, this.state.phase);
    return { text, emotion: this.emotion, phase: this.state.phase, event };
  }

  // Adapt difficulty from a rolling performance score (0-100).
  adaptDifficulty(performance: number): void {
    this.difficulty = adapt(this.difficulty, performance);
    this.directives = directivesFor(this.difficulty);
  }

  // LLM seam: routes a turn through the provider-agnostic AI service (mock today).
  async aiTurn(learnerText: string): Promise<string> {
    const prompt = `${buildSystemPrompt({
      role: this.scenario.role,
      personality: this.scenario.personality,
      emotion: this.emotion,
      goals: this.scenario.goals,
      scenarioType: this.scenario.scenarioType,
      difficulty: this.difficulty,
      phase: this.state.phase,
      events: this.scenario.events,
      memoryBriefing: memoryBriefing(this.memory),
    })}\n\nTrainee said: "${learnerText}"\nRespond in character:`;
    const res = await aiService.generate({ task: 'conversation', input: prompt, context: { scenarioId: this.scenario.id } });
    return res.success ? String(res.response) : this.replyText();
  }

  private replyText(): string {
    const byEmotion: Record<Emotion, string> = {
      Happy: 'That sounds great, thank you! What do we do next?',
      Satisfied: 'Perfect, that works for me.',
      Neutral: 'Okay. Can you tell me more about that?',
      Curious: 'Interesting — how does that part work?',
      Confused: "I'm a little lost. Could you explain that again?",
      Anxious: "I'm a bit worried about this. Is it going to be okay?",
      Impatient: "I don't have much time — can we speed this up?",
      Frustrated: "That's not really what I was hoping to hear.",
      Disappointed: "Hmm. I expected a bit more, honestly.",
      Excited: "Oh nice! Yes, let's do that.",
    };
    return byEmotion[this.emotion];
  }
}

export function createSimulationContext(scenario: GeneratedScenario): SimulationRuntime {
  return new SimulationRuntime(scenario);
}
