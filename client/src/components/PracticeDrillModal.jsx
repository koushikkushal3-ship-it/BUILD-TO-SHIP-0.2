import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, XCircle, RotateCcw, PlayCircle } from 'lucide-react';
import { apiClient } from '../lib/apiClient.js';
import Spinner from './Spinner.jsx';

const LETTERS = ['A', 'B', 'C', 'D'];

export default function PracticeDrillModal({ skillTag, resources, onClose }) {
  const [question, setQuestion] = useState(null);
  const [selected, setSelected] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  async function loadNewQuestion() {
    setLoading(true);
    setLoadError('');
    setSelected(null);
    setRevealed(false);
    try {
      const { data } = await apiClient.post('/practice/drill', { skillTag });
      setQuestion(data.question);
    } catch (err) {
      // Generating a drill is a live Gemini call, so it can genuinely fail.
      // Say so instead of spinning forever.
      setLoadError(
        err.response?.data?.error ||
          (err.response ? "Couldn't generate a question. Try again." : 'Could not reach the server.')
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadNewQuestion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skillTag]);

  function handleAnswer(index) {
    if (revealed) return;
    setSelected(index);
    setRevealed(true);
    apiClient.post('/practice/drill/result', { skillTag, correct: index === question.correctOptionIndex });
  }

  const correct = question && selected === question.correctOptionIndex;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="card max-h-[85vh] w-full max-w-lg overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-400">Practice drill · {skillTag}</p>
            <button onClick={onClose} className="text-slate-500 hover:text-slate-300">
              <X size={18} />
            </button>
          </div>

          {resources?.length > 0 && (
            <div className="mt-3">
              <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <PlayCircle size={13} /> Watch before you try
              </p>
              <div className="grid grid-cols-3 gap-2">
                {resources.map((r) => (
                  <a
                    key={r.url}
                    href={r.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex flex-col gap-1 rounded-lg border border-charcoal-700 p-1.5 transition hover:border-amber-500/50"
                  >
                    {r.thumbnail_url && (
                      <img src={r.thumbnail_url} alt="" className="h-14 w-full rounded object-cover" />
                    )}
                    <span className="line-clamp-2 text-[11px] text-slate-400">{r.title}</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {loading && <Spinner label="Generating a question…" />}
          {loadError && <p className="mt-3 text-sm text-red-400">{loadError}</p>}

          {!loading && question && (
            <>
              <p className="mt-3 whitespace-pre-wrap text-base text-slate-100">{question.text}</p>

              <div className="mt-4 flex flex-col gap-2.5">
                {question.options.map((option, i) => {
                  const isSelected = selected === i;
                  const isCorrectOption = i === question.correctOptionIndex;
                  let style = 'border-charcoal-600 bg-charcoal-800 text-slate-300 hover:border-amber-500/40';
                  if (revealed && isCorrectOption) style = 'border-panel-hr bg-panel-hr/10 text-panel-hr';
                  else if (revealed && isSelected) style = 'border-panel-skeptical bg-panel-skeptical/10 text-panel-skeptical';

                  return (
                    <button
                      key={i}
                      type="button"
                      disabled={revealed}
                      onClick={() => handleAnswer(i)}
                      className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-left text-sm transition disabled:cursor-default ${style}`}
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-charcoal-700 text-xs font-semibold">
                        {LETTERS[i]}
                      </span>
                      <span>{option}</span>
                      {revealed && isCorrectOption && <CheckCircle2 size={14} className="ml-auto shrink-0" />}
                      {revealed && isSelected && !isCorrectOption && <XCircle size={14} className="ml-auto shrink-0" />}
                    </button>
                  );
                })}
              </div>

              {revealed && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`mt-4 rounded-lg border-l-4 p-3 text-sm ${
                    correct ? 'border-panel-hr bg-panel-hr/5 text-slate-300' : 'border-panel-skeptical bg-panel-skeptical/5 text-slate-300'
                  }`}
                >
                  <p className={`mb-1 flex items-center gap-1.5 font-semibold ${correct ? 'text-panel-hr' : 'text-panel-skeptical'}`}>
                    {correct ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                    {correct ? 'Correct!' : 'Not quite'}
                  </p>
                  <p className="text-slate-400">{question.explanation}</p>
                </motion.div>
              )}

              <div className="mt-5 flex justify-end">
                <button onClick={loadNewQuestion} className="btn-primary inline-flex items-center gap-1.5">
                  <RotateCcw size={14} /> {revealed ? 'Try another' : 'Skip to another'}
                </button>
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
