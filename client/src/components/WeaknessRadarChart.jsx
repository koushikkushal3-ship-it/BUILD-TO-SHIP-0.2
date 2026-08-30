import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts';
import { useTheme } from '../context/ThemeContext.jsx';

const PALETTES = {
  dark: { grid: '#33363f', axis: '#94a3b8', accent: '#fca5a5' },
  light: { grid: '#e2ddd1', axis: '#57606f', accent: '#dc2626' },
};

// Clickable axis label instead of a clickable data point: with several
// skills often tied at the same score, their dots all collapse onto the
// exact same pixel and can't be distinguished or clicked individually — the
// label around the perimeter is always uniquely positioned regardless of
// score, so that's the reliable place to hang the click target.
function makeClickableTick(color, onSkillClick) {
  return function ClickableTick({ x, y, textAnchor, payload }) {
    return (
      <text
        x={x}
        y={y}
        textAnchor={textAnchor}
        fontSize={11}
        fill={color}
        style={{ cursor: onSkillClick ? 'pointer' : 'default' }}
        onClick={() => onSkillClick?.(payload.value)}
      >
        {payload.value}
      </text>
    );
  };
}

// `data` is skill-mastery pairs: [{ skillTag, score }]. Clicking a skill's
// label drills into that skill's score history — this is what makes it a
// drill-down radar rather than a read-only snapshot.
export default function WeaknessRadarChart({ data, onSkillClick }) {
  const { theme } = useTheme();
  const p = PALETTES[theme];

  if (!data.length) {
    return <p className="text-sm text-slate-500">Complete a few sessions to build your skill profile.</p>;
  }

  return (
    <>
      <ResponsiveContainer width="100%" height={260}>
        <RadarChart data={data}>
          <PolarGrid stroke={p.grid} />
          <PolarAngleAxis
            dataKey="skillTag"
            tick={makeClickableTick(p.axis, onSkillClick)}
          />
          <PolarRadiusAxis stroke={p.grid} fontSize={10} domain={[0, 100]} />
          <Radar dataKey="score" stroke={p.accent} fill={p.accent} fillOpacity={0.35} animationDuration={600} />
        </RadarChart>
      </ResponsiveContainer>
      {onSkillClick && <p className="text-center text-xs text-slate-500">Click a skill name to see its history</p>}
    </>
  );
}
