const WEAK = 65;
const STRONG = 85;

function badgeClass(score) {
  if (score < WEAK) return 'bg-panel-skeptical/10 text-panel-skeptical';
  if (score < STRONG) return 'bg-amber-500/10 text-amber-400';
  return 'bg-panel-hr/10 text-panel-hr';
}

export default function SkillScoreList({ data, onSkillClick }) {
  if (!data.length) {
    return <p className="text-sm text-slate-500">Complete a few sessions to build your skill profile.</p>;
  }

  const sorted = [...data].sort((a, b) => a.score - b.score);

  return (
    <div className="flex flex-col gap-2">
      {sorted.map((s) => (
        <button
          key={s.skillTag}
          onClick={() => onSkillClick?.(s.skillTag)}
          className="flex w-full items-center justify-between rounded-lg border border-charcoal-700 bg-charcoal-800/50 px-3 py-2 text-left transition hover:border-amber-500/40"
        >
          <span className="min-w-0 truncate text-sm text-slate-200">{s.skillTag}</span>
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${badgeClass(s.score)}`}>{s.score}/100</span>
        </button>
      ))}
    </div>
  );
}
