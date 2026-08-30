import { motion } from 'framer-motion';

const LETTERS = ['A', 'B', 'C', 'D'];

export default function McqOptions({ options, selectedIndex, onSelect, disabled }) {
  return (
    <div className="flex flex-col gap-2.5">
      {options.map((option, i) => {
        const isSelected = selectedIndex === i;
        return (
          <motion.button
            key={i}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(i)}
            whileHover={disabled ? {} : { scale: 1.01 }}
            whileTap={disabled ? {} : { scale: 0.99 }}
            className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-left transition disabled:cursor-not-allowed ${
              isSelected
                ? 'border-amber-500 bg-amber-500/10 text-slate-100'
                : 'border-charcoal-600 bg-charcoal-800 text-slate-300 hover:border-amber-500/40'
            }`}
          >
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                isSelected ? 'bg-amber-500 text-neutral-900' : 'bg-charcoal-700 text-slate-400'
              }`}
            >
              {LETTERS[i]}
            </span>
            <span className="text-sm">{option}</span>
          </motion.button>
        );
      })}
    </div>
  );
}
