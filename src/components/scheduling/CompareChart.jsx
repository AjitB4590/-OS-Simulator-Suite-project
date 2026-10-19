/**
 * Recharts Comparison Bar Chart component.
 * Visualizes Average Waiting, Turnaround, and Response times side-by-side
 * with adaptive color palette synchronized to light/dark themes.
 */

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

/**
 * @param {{
 *   comparisons: Array<{ algoId: string, name: string, metrics: { avgWt: number, avgTat: number, avgRt: number } }>,
 *   isDark: boolean
 * }} props
 */
export function CompareChart({ comparisons, isDark }) {
  if (!comparisons || comparisons.length === 0) return null;

  const chartData = comparisons.map((item) => ({
    name: item.algoId.toUpperCase(),
    fullName: item.name,
    'Avg WT': item.metrics.avgWt,
    'Avg TAT': item.metrics.avgTat,
    'Avg RT': item.metrics.avgRt,
  }));

  const axisColor = isDark ? '#94a3b8' : '#64748b';
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';
  const tooltipBg = isDark ? '#101828' : '#ffffff';
  const tooltipBorder = isDark ? '#1e293b' : '#e2e8f0';

  return (
    <div style={{ width: '100%', height: 320, marginTop: '1rem' }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 20, right: 20, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis dataKey="name" stroke={axisColor} fontSize={12} tickLine={false} />
          <YAxis stroke={axisColor} fontSize={12} tickLine={false} />
          <Tooltip
            contentStyle={{
              backgroundColor: tooltipBg,
              borderColor: tooltipBorder,
              borderRadius: '8px',
              fontSize: '0.85rem',
            }}
          />
          <Legend wrapperStyle={{ fontSize: '0.85rem' }} />
          <Bar dataKey="Avg WT" fill="#38bdf8" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Avg TAT" fill="#a78bfa" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Avg RT" fill="#34d399" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
