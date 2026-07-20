import type { LearningPath, CourseModule, ModuleProgress, PathProgress } from '../types/learning';

export interface ProgressInput {
  completedLessonIds: Set<string>;
  quizScores: Record<string, number>; // quizId -> best percentage
  simScores: Record<string, number>; // moduleId -> best simulation score
}

export function emptyProgressInput(): ProgressInput {
  return { completedLessonIds: new Set(), quizScores: {}, simScores: {} };
}

function isModuleComplete(m: CourseModule, input: ProgressInput): boolean {
  const lessonsDone = m.lessons.every((l) => input.completedLessonIds.has(l.id));
  const quizPassed = (input.quizScores[m.quiz.id] ?? -1) >= m.quiz.passingScore;
  const simPassed = (input.simScores[m.id] ?? -1) >= m.simulation.minScore;
  return lessonsDone && quizPassed && simPassed;
}

function moduleStarted(m: CourseModule, input: ProgressInput): boolean {
  if (m.lessons.some((l) => input.completedLessonIds.has(l.id))) return true;
  if (input.quizScores[m.quiz.id] != null) return true;
  if (input.simScores[m.id] != null) return true;
  return false;
}

export function computeModuleProgress(
  m: CourseModule,
  input: ProgressInput,
  unlocked: boolean,
): ModuleProgress {
  const lessonsDone = m.lessons.filter((l) => input.completedLessonIds.has(l.id)).length;
  const quizPassed = (input.quizScores[m.quiz.id] ?? -1) >= m.quiz.passingScore;
  const simScore = input.simScores[m.id] ?? null;
  const simulationPassed = simScore != null && simScore >= m.simulation.minScore;
  const complete = isModuleComplete(m, input);

  let status: ModuleProgress['status'];
  if (complete) status = 'completed';
  else if (!unlocked) status = 'locked';
  else if (moduleStarted(m, input)) status = 'in_progress';
  else status = 'available';

  return {
    moduleId: m.id,
    status,
    lessonsDone,
    lessonsTotal: m.lessons.length,
    quizPassed,
    simulationScore: simScore,
    simulationPassed,
    complete,
  };
}

export function computePathProgress(path: LearningPath, input: ProgressInput): PathProgress {
  const modules: ModuleProgress[] = [];
  let prevComplete = true; // first module is always unlocked
  let completedModules = 0;

  for (const m of path.modules) {
    const mp = computeModuleProgress(m, input, prevComplete);
    modules.push(mp);
    if (mp.complete) completedModules++;
    prevComplete = mp.complete;
  }

  const totalModules = path.modules.length;
  const progressPct = totalModules ? Math.round((completedModules / totalModules) * 100) : 0;

  return {
    pathId: path.id,
    modules,
    completedModules,
    totalModules,
    progressPct,
    complete: completedModules === totalModules && totalModules > 0,
  };
}

// The next actionable item in a module: which lesson/quiz/simulation to do next.
export type NextAction =
  | { kind: 'lesson'; lessonId: string }
  | { kind: 'quiz' }
  | { kind: 'simulation' }
  | { kind: 'done' };

export function nextActionForModule(m: CourseModule, input: ProgressInput): NextAction {
  const nextLesson = m.lessons.find((l) => !input.completedLessonIds.has(l.id));
  if (nextLesson) return { kind: 'lesson', lessonId: nextLesson.id };
  if ((input.quizScores[m.quiz.id] ?? -1) < m.quiz.passingScore) return { kind: 'quiz' };
  if ((input.simScores[m.id] ?? -1) < m.simulation.minScore) return { kind: 'simulation' };
  return { kind: 'done' };
}
