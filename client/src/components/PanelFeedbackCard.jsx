import { motion } from 'framer-motion';
import AnimatedNumber from './AnimatedNumber.jsx';

const PERSONA_META = {
  hr: { label: 'HR Panelist', color: 'border-panel-hr', text: 'text-panel-hr' },
  technical: { label: 'Technical Lead', color: 'border-panel-technical', text: 'text-panel-technical' },
  skeptical: { label: 'Skeptical Hiring Manager', color: 'border-panel-skeptical', text: 'text-panel-skeptical' },
};

export default function PanelFeedbackCard({ persona, score, comment, flaggedIssues, delay = 0 }) {
  const meta = PERSONA_META[persona] || PERSONA_META.hr;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, delay }}
      className={`card-interactive border-l-4 ${meta.color}`}
    >
      <div className="flex items-center justify-between">
        <span className={`text-sm font-semibold ${meta.text}`}>{meta.label}</span>
        <AnimatedNumber value={score} className="font-display text-xl font-bold text-slate-100" />
      </div>
      <p className="mt-2 text-sm text-slate-300">{comment}</p>
      {flaggedIssues?.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {flaggedIssues.map((issue) => (
            <li
              key={issue}
              className="rounded-full bg-charcoal-800 px-2.5 py-0.5 text-xs text-slate-400 transition hover:bg-charcoal-700 hover:text-slate-300"
            >
              {issue}
            </li>
          ))}
        </ul>
      )}
    </motion.div>
  );
}
