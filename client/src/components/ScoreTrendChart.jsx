import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useTheme } from '../context/ThemeContext.jsx';

// Recharts takes literal color props, not Tailwind classes, so it can't pick
// up the CSS-variable theme automatically — pick the matching palette here.
const PALETTES = {
  dark: { grid: '#24262e', axis: '#64748b', tooltipBg: '#1a1c22', tooltipBorder: '#33363f', line: '#e8a628' },
  light: { grid: '#e2ddd1', axis: '#57606f', tooltipBg: '#ffffff', tooltipBorder: '#e2ddd1', line: '#d97706' },
};

export default function ScoreTrendChart({ data }) {
  const { theme } = useTheme();
  const p = PALETTES[theme];

  if (!data.length) {
    return <p className="text-sm text-slate-500">Complete a session to see your trend.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data}>
        <CartesianGrid stroke={p.grid} strokeDasharray="3 3" />
        <XAxis dataKey="label" stroke={p.axis} fontSize={12} />
        <YAxis domain={[0, 100]} stroke={p.axis} fontSize={12} />
        <Tooltip contentStyle={{ background: p.tooltipBg, border: `1px solid ${p.tooltipBorder}`, borderRadius: 8 }} />
        <Line type="monotone" dataKey="score" stroke={p.line} strokeWidth={2} dot={{ r: 4 }} animationDuration={600} />
      </LineChart>
    </ResponsiveContainer>
  );
}
