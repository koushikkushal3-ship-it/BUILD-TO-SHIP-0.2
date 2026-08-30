import { motion } from 'framer-motion';
import { CheckCircle2, XCircle } from 'lucide-react';

const LETTERS = ['A', 'B', 'C', 'D'];

export default function McqResultCard({ options, selectedIndex, correctOptionIndex, correct, explanation }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={`card border-l-4 ${correct ? 'border-panel-hr' : 'border-panel-skeptical'}`}
    >
      <div className={`flex items-center gap-2 font-semibold ${correct ? 'text-panel-hr' : 'text-panel-skeptical'}`}>
        {correct ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
        {correct ? 'Correct!' : 'Not quite'}
      </div>

      <div className="mt-3 flex flex-col gap-2">
        {options.map((option, i) => {
          const isCorrect = i === correctOptionIndex;
          const isSelected = i === selectedIndex;
          return (
            <div
              key={i}
              className={`flex items-center gap-3 rounded-lg border px-3 py-2 text-sm ${
                isCorrect
                  ? 'border-panel-hr bg-panel-hr/10 text-panel-hr'
                  : isSelected
                    ? 'border-panel-skeptical bg-panel-skeptical/10 text-panel-skeptical'
                    : 'border-charcoal-700 text-slate-500'
              }`}
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-charcoal-800 text-xs">
                {LETTERS[i]}
              </span>
              {option}
              {isCorrect && <CheckCircle2 size={14} className="ml-auto shrink-0" />}
              {isSelected && !isCorrect && <XCircle size={14} className="ml-auto shrink-0" />}
            </div>
          );
        })}
      </div>

      <p className="mt-3 text-sm text-slate-400">{explanation}</p>
    </motion.div>
  );
}
