import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { XCircle } from 'lucide-react';

export default function SessionTerminated() {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card mx-auto max-w-lg text-center">
      <XCircle size={32} className="mx-auto mb-3 text-panel-skeptical" />
      <h1 className="font-display text-xl font-semibold text-slate-100">Session terminated</h1>
      <p className="mt-2 text-sm text-slate-400">
        This session was ended after 2 tab-switching / fullscreen-exit violations. Your progress up to that
        point wasn't scored — start a new session when you're ready to complete it without leaving the tab.
      </p>
      <Link to="/dashboard" className="btn-primary mt-5 inline-block">
        Back to dashboard
      </Link>
    </motion.div>
  );
}
