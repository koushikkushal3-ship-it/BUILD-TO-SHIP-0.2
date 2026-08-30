import { motion } from 'framer-motion';
import { ShieldAlert, Maximize, Mic, Copy, PlugZap } from 'lucide-react';

export default function ProctoringGate({ onBegin }) {
  async function handleBegin() {
    try {
      await document.documentElement.requestFullscreen();
    } catch {
      // Fullscreen can be denied/unsupported — the session still proceeds,
      // it just won't be able to detect a fullscreen-exit violation, only
      // tab-switch. Never block the candidate over a browser limitation.
    }
    try {
      // Requesting (and immediately releasing) the mic upfront means the
      // permission prompt is out of the way before the first question, so
      // voice mode doesn't stall mid-answer waiting on a browser dialog.
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
    } catch {
      // Denied/unsupported — voice mode already falls back to typed input.
    }
    onBegin();
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="card mx-auto max-w-lg text-center"
    >
      <ShieldAlert size={32} className="mx-auto mb-3 text-amber-400" />
      <h1 className="font-display text-xl font-semibold text-slate-100">Before you begin</h1>
      <p className="mt-2 text-sm text-slate-400">
        This session runs in fullscreen and will ask for microphone access (for voice mode). Switching
        tabs, minimizing the window, or exiting fullscreen counts as a violation.
      </p>

      <div className="mt-4 flex flex-col gap-2 rounded-lg border border-charcoal-600 bg-charcoal-800 p-3 text-left text-sm text-slate-400">
        <span className="flex items-center gap-2">
          <Maximize size={14} className="shrink-0 text-amber-400" /> Fullscreen &amp; camera-free proctoring for
          the whole session
        </span>
        <span className="flex items-center gap-2">
          <Mic size={14} className="shrink-0 text-amber-400" /> Microphone access, only used if you switch on
          voice mode
        </span>
        <span className="flex items-center gap-2">
          <Copy size={14} className="shrink-0 text-amber-400" /> Copy, cut, and paste are disabled for the
          duration of the session
        </span>
        <span className="flex items-center gap-2">
          <PlugZap size={14} className="shrink-0 text-amber-400" /> Close AI/coding browser extensions
          (Grammarly, ChatGPT sidebars, autocomplete tools, etc.) before continuing — we can't detect these
          automatically, but panel feedback is scored on your own reasoning
        </span>
      </div>

      <p className="mt-3 text-sm font-medium text-panel-skeptical">
        2 violations will terminate the session — there's no third warning.
      </p>
      <button onClick={handleBegin} className="btn-primary mt-5 inline-flex items-center gap-2">
        <Maximize size={16} />
        Grant access &amp; begin
      </button>
    </motion.div>
  );
}
