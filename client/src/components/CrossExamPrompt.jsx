import { useState } from 'react';
import { motion } from 'framer-motion';
import { Swords } from 'lucide-react';
import VoiceCapture from './VoiceCapture.jsx';
import TypingDots from './TypingDots.jsx';

export default function CrossExamPrompt({ challengeQuestion, onSubmit, submitting }) {
  const [rebuttal, setRebuttal] = useState('');

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="card border-l-4 border-panel-skeptical"
    >
      <div className="flex items-center gap-2 text-panel-skeptical">
        <motion.span
          animate={{ rotate: [0, -8, 8, 0] }}
          transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 1 }}
        >
          <Swords size={18} />
        </motion.span>
        <span className="text-sm font-semibold">The panel is pushing back</span>
      </div>
      <p className="mt-2 text-slate-100">{challengeQuestion}</p>

      <textarea
        rows={4}
        className="input-field mt-4 resize-none"
        placeholder="Defend or clarify your answer…"
        value={rebuttal}
        onChange={(e) => setRebuttal(e.target.value)}
      />

      <div className="mt-3 flex items-center justify-between">
        <VoiceCapture onTranscript={(text) => setRebuttal((prev) => `${prev} ${text}`.trim())} />
        <button
          disabled={!rebuttal.trim() || submitting}
          onClick={() => onSubmit(rebuttal)}
          className="btn-primary"
        >
          {submitting ? (
            <span className="flex items-center gap-1.5">
              Submitting <TypingDots />
            </span>
          ) : (
            'Submit rebuttal'
          )}
        </button>
      </div>
    </motion.div>
  );
}
