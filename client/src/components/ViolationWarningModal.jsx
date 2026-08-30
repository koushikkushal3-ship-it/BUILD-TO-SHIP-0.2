import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

const MAX_VIOLATIONS = 2;

export default function ViolationWarningModal({ violationCount, onAcknowledge }) {
  async function handleAcknowledge() {
    try {
      await document.documentElement.requestFullscreen();
    } catch {
      // Same as the initial gate — proceed regardless of fullscreen support.
    }
    onAcknowledge();
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="card max-w-sm border-l-4 border-panel-skeptical text-center"
        >
          <AlertTriangle size={32} className="mx-auto mb-3 text-panel-skeptical" />
          <h2 className="font-display text-lg font-semibold text-slate-100">
            Violation {violationCount} of {MAX_VIOLATIONS}
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            You switched tabs or left fullscreen. Do this once more and the session will be terminated
            automatically.
          </p>
          <button onClick={handleAcknowledge} className="btn-primary mt-4 w-full">
            Return to fullscreen &amp; continue
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
