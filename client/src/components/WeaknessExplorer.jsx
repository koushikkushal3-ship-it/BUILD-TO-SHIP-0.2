import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Lightbulb, Target, PlayCircle } from 'lucide-react';
import { apiClient } from '../lib/apiClient.js';
import TypingDots from './TypingDots.jsx';

function WeaknessRow({ skill, onPractice }) {
  const [open, setOpen] = useState(false);
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    if (open) {
      setOpen(false);
      return;
    }
    setOpen(true);
    if (!details && !loading) {
      setLoading(true);
      const { data } = await apiClient.get('/practice/weak-skills/explain', { params: { skillTag: skill.skillTag } });
      setDetails(data);
      setLoading(false);
    }
  }

  return (
    <div className="rounded-lg border border-charcoal-700 bg-charcoal-800/50">
      <button
        type="button"
        onClick={toggle}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="min-w-0 truncate text-sm font-medium text-slate-100">{skill.skillTag}</span>
          <span className="shrink-0 rounded-full bg-panel-skeptical/10 px-2 py-0.5 text-xs text-panel-skeptical">
            {skill.masteryScore}/100
          </span>
        </div>
        <ChevronDown size={16} className={`shrink-0 text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="border-t border-charcoal-700 px-4 py-3">
              {loading && (
                <span className="flex items-center gap-1.5 text-sm text-slate-500">
                  Thinking it through <TypingDots />
                </span>
              )}

              {details && (
                <div className="flex flex-col gap-3">
                  <div className="flex gap-2 text-sm text-slate-300">
                    <Lightbulb size={15} className="mt-0.5 shrink-0 text-amber-400" />
                    <p>{details.explanation}</p>
                  </div>
                  <div className="flex gap-2 text-sm text-slate-400">
                    <Target size={15} className="mt-0.5 shrink-0 text-slate-500" />
                    <p>{details.whyItMatters}</p>
                  </div>
                  <p className="rounded-lg bg-amber-500/5 px-3 py-2 text-sm text-amber-300">{details.quickTip}</p>

                  {skill.resources?.length > 0 && (
                    <div className="mt-1 grid gap-2 sm:grid-cols-3">
                      {skill.resources.map((r) => (
                        <a
                          key={r.url}
                          href={r.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex flex-col gap-1.5 rounded-lg border border-charcoal-700 p-2 transition hover:border-amber-500/50"
                        >
                          {r.thumbnail_url && (
                            <img src={r.thumbnail_url} alt="" className="h-16 w-full rounded object-cover" />
                          )}
                          <span className="line-clamp-2 text-xs text-slate-400">{r.title}</span>
                        </a>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={() => onPractice(skill.skillTag, skill.resources)}
                    className="btn-primary mt-1 inline-flex items-center justify-center gap-1.5 self-start"
                  >
                    <PlayCircle size={15} /> Practice this now
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function WeaknessExplorer({ weakSkills, onPractice }) {
  if (!weakSkills.length) {
    return (
      <p className="text-sm text-slate-500">
        No tagged weaknesses yet — complete a session and this fills in with exactly what to work on.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {weakSkills.map((skill) => (
        <WeaknessRow key={skill.skillTag} skill={skill} onPractice={onPractice} />
      ))}
    </div>
  );
}
