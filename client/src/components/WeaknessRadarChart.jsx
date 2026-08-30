import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts';
import { useTheme } from '../context/ThemeContext.jsx';

const PALETTES = {
  dark: { grid: '#33363f', axis: '#94a3b8', accent: '#fca5a5' },
  light: { grid: '#e2ddd1', axis: '#57606f', accent: '#dc2626' },
};

export default function WeaknessRadarChart({ data }) {
  const { theme } = useTheme();
  const p = PALETTES[theme];

  if (!data.length) {
    return <p className="text-sm text-slate-500">Complete a few sessions to build your weakness profile.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <RadarChart data={data}>
        <PolarGrid stroke={p.grid} />
        <PolarAngleAxis dataKey="issue" stroke={p.axis} fontSize={11} />
        <PolarRadiusAxis stroke={p.grid} fontSize={10} />
        <Radar dataKey="count" stroke={p.accent} fill={p.accent} fillOpacity={0.35} animationDuration={600} />
      </RadarChart>
    </ResponsiveContainer>
  );
}
