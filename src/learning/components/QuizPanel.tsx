import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, Lock, HelpCircle, RotateCcw } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import type { Quiz } from '../types/learning';

interface QuizPanelProps {
  quiz: Quiz;
  locked: boolean;
  bestScore?: number;
  onSubmit: (answers: number[]) => Promise<{ score: number; passed: boolean }>;
}

export function QuizPanel({ quiz, locked, bestScore, onSubmit }: QuizPanelProps) {
  const [answers, setAnswers] = useState<number[]>(() => quiz.questions.map(() => -1));
  const [result, setResult] = useState<{ score: number; passed: boolean } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const allAnswered = answers.every((a) => a >= 0);

  const handleSubmit = async () => {
    setSubmitting(true);
    const r = await onSubmit(answers);
    setResult(r);
    setSubmitting(false);
  };

  const reset = () => { setAnswers(quiz.questions.map(() => -1)); setResult(null); };

  if (locked) {
    return (
      <div className="card p-6 text-center">
        <Lock size={22} className="mx-auto text-ink-300 mb-2" />
        <p className="text-sm text-ink-500 dark:text-ink-400">Complete all lessons to unlock the quiz.</p>
      </div>
    );
  }

  return (
    <div className="card p-5 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="font-display font-bold text-ink-800 dark:text-ink-100 flex items-center gap-2">
          <HelpCircle size={18} className="text-lava-600" /> {quiz.title}
        </h3>
        <span className="text-xs text-ink-500 dark:text-ink-400">Pass: {quiz.passingScore}%</span>
      </div>

      {quiz.questions.map((q, qi) => {
        const chosen = answers[qi];
        const showAnswer = result != null;
        return (
          <div key={q.id}>
            <p className="text-sm font-medium text-ink-800 dark:text-ink-100 mb-2">{qi + 1}. {q.question}</p>
            <div className="space-y-2">
              {q.options.map((opt, oi) => {
                const selected = chosen === oi;
                const correct = oi === q.correctIndex;
                let cls = 'border-ink-200 dark:border-ink-700 hover:border-lava-400';
                if (showAnswer && correct) cls = 'border-green-500 bg-green-50 dark:bg-green-900/20';
                else if (showAnswer && selected && !correct) cls = 'border-red-500 bg-red-50 dark:bg-red-900/20';
                else if (selected) cls = 'border-lava-500 bg-lava-50 dark:bg-lava-950/30';
                return (
                  <button
                    key={oi}
                    disabled={showAnswer}
                    onClick={() => setAnswers((prev) => prev.map((a, i) => (i === qi ? oi : a)))}
                    className={`w-full text-left px-4 py-2.5 rounded-xl border text-sm text-ink-700 dark:text-ink-200 transition-colors flex items-center justify-between gap-2 ${cls}`}
                  >
                    <span>{opt}</span>
                    {showAnswer && correct && <CheckCircle2 size={16} className="text-green-600 shrink-0" />}
                    {showAnswer && selected && !correct && <XCircle size={16} className="text-red-600 shrink-0" />}
                  </button>
                );
              })}
            </div>
            {showAnswer && (
              <p className="text-xs text-ink-500 dark:text-ink-400 mt-2 italic">{q.explanation}</p>
            )}
          </div>
        );
      })}

      {result ? (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
          className={`rounded-xl p-4 flex items-center justify-between gap-3 ${
            result.passed ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'
          }`}>
          <div className="flex items-center gap-2">
            {result.passed ? <CheckCircle2 size={20} className="text-green-600" /> : <XCircle size={20} className="text-red-600" />}
            <p className="text-sm font-semibold text-ink-800 dark:text-ink-100">
              {result.passed ? 'Passed' : 'Not passed'} — {result.score}%
            </p>
          </div>
          {!result.passed && (
            <Button size="sm" variant="secondary" onClick={reset}><RotateCcw size={14} /> Retake</Button>
          )}
        </motion.div>
      ) : (
        <div className="flex items-center justify-between">
          {bestScore != null && <span className="text-xs text-ink-500 dark:text-ink-400">Best: {bestScore}%</span>}
          <Button size="sm" className="ml-auto" disabled={!allAnswered || submitting} onClick={handleSubmit}>
            {submitting ? 'Checking…' : 'Submit quiz'}
          </Button>
        </div>
      )}
    </div>
  );
}
