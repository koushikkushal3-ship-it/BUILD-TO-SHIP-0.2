import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Flame, CheckCircle2, XCircle } from 'lucide-react';
import { apiClient } from '../lib/apiClient.js';
import Spinner from './Spinner.jsx';

const LETTERS = ['A', 'B', 'C', 'D'];

export default function DailyChallengeCard() {
  const [challenge, setChallenge] = useState(null);
  const [streak, setStreak] = useState(0);
  const [selected, setSelected] = useState(null);
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    apiClient
      .get('/practice/daily-challenge')
      .then(({ data }) => {
        setChallenge(data.challenge);
        setStreak(data.streak);
      })
      .catch(() => setError("Couldn't load today's challenge — try refreshing in a moment."));
  }, []);

  async function handleAnswer(index) {
    if (challenge.completed || submitting) return;
    setSelected(index);
    setSubmitting(true);
    const { data } = await apiClient.post('/practice/daily-challenge/answer', { selectedOptionIndex: index });
    setResult(data);
    setStreak(data.streak);
    setSubmitting(false);
  }

  if (error) return <p className="text-sm text-slate-500">{error}</p>;
  if (!challenge) return <Spinner label="Loading today's challenge…" />;

  const alreadyDone = challenge.completed;
  const showResult = alreadyDone || result;
  const correct = result ? result.correct : challenge.selected_option_index === challenge.correct_option_index;
  const correctIndex = result ? result.correctOptionIndex : challenge.correct_option_index;
  const explanation = result ? result.explanation : challenge.explanation;
  const pickedIndex = selected ?? challenge.selected_option_index;

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        {challenge.skill_tag && (
          <span className="rounded-full bg-charcoal-800 px-2.5 py-0.5 text-xs text-slate-500">{challenge.skill_tag}</span>
        )}
        <span className="flex items-center gap-1 text-sm font-semibold text-amber-400">
          <Flame size={16} /> {streak} day{streak === 1 ? '' : 's'}
        </span>
      </div>

      <p className="text-sm text-slate-100">{challenge.question_text}</p>

      <div className="mt-3 flex flex-col gap-2">
        {challenge.options.map((option, i) => {
          const isSelected = pickedIndex === i;
          let style = 'border-charcoal-600 bg-charcoal-800 text-slate-300 hover:border-amber-500/40';
          if (showResult && i === correctIndex) style = 'border-panel-hr bg-panel-hr/10 text-panel-hr';
          else if (showResult && isSelected) style = 'border-panel-skeptical bg-panel-skeptical/10 text-panel-skeptical';

          return (
            <button
              key={i}
              type="button"
              disabled={alreadyDone || Boolean(result) || submitting}
              onClick={() => handleAnswer(i)}
              className={`flex items-center gap-2.5 rounded-lg border px-3 py-2 text-left text-sm transition disabled:cursor-default ${style}`}
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-charcoal-700 text-xs">
                {LETTERS[i]}
              </span>
              {option}
            </button>
          );
        })}
      </div>

      {showResult && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mt-3 flex items-start gap-2 rounded-lg border-l-4 p-3 text-sm ${
            correct ? 'border-panel-hr bg-panel-hr/5' : 'border-panel-skeptical bg-panel-skeptical/5'
          }`}
        >
          {correct ? (
            <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-panel-hr" />
          ) : (
            <XCircle size={16} className="mt-0.5 shrink-0 text-panel-skeptical" />
          )}
          <p className="text-slate-400">{explanation}</p>
        </motion.div>
      )}

      {!showResult && (
        <p className="mt-3 text-xs text-slate-500">One question a day, picked from your weakest skill — come back tomorrow for the next one.</p>
      )}
    </div>
  );
}
