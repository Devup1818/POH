'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#ec4899'];

const STATUS_COLORS: Record<string, string> = {
  'On Schedule': '#10b981',
  'Ahead of Schedule': '#06b6d4',
  'Minor Delay': '#f59e0b',
  'Significant Delay': '#ef4444',
};

interface ChartDataItem {
  label: string;
  value: number;
  target?: number;
  [key: string]: string | number | undefined;
}

interface PerformanceChartProps {
  data: ChartDataItem[];
  type: 'bar' | 'line' | 'pie';
  height?: number;
  valueLabel?: string;
  targetLabel?: string;
  valueColor?: string;
  targetColor?: string;
  unit?: string;
  showLegend?: boolean;
}

export function PerformanceChart({
  data,
  type,
  height = 300,
  valueLabel = 'Value',
  targetLabel = 'Target',
  valueColor = '#3b82f6',
  targetColor = '#9ca3af',
  unit = '',
  showLegend = true,
}: PerformanceChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center text-sm text-gray-400" style={{ height }}>
        No data available
      </div>
    );
  }

  if (type === 'pie') {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            dataKey="value"
            nameKey="label"
            label={({ name, value }: { name?: string; value?: number }) => `${name ?? ''}: ${value ?? 0}${unit}`}
            labelLine={false}
          >
            {data.map((entry, index) => (
              <Cell
                key={entry.label}
                fill={STATUS_COLORS[entry.label] ?? COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip formatter={(value) => `${value}${unit}`} />
          {showLegend && <Legend />}
        </PieChart>
      </ResponsiveContainer>
    );
  }

  if (type === 'line') {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="label" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip formatter={(value) => `${value}${unit}`} />
          {showLegend && <Legend />}
          <Line
            type="monotone"
            dataKey="value"
            name={valueLabel}
            stroke={valueColor}
            strokeWidth={2}
            dot={{ r: 4 }}
          />
          {data.some((d) => d.target != null) && (
            <Line
              type="monotone"
              dataKey="target"
              name={targetLabel}
              stroke={targetColor}
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    );
  }

  // Bar chart (default)
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="label" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip formatter={(value) => `${value}${unit}`} />
        {showLegend && <Legend />}
        <Bar dataKey="value" name={valueLabel} fill={valueColor} radius={[4, 4, 0, 0]} />
        {data.some((d) => d.target != null) && (
          <Bar dataKey="target" name={targetLabel} fill={targetColor} radius={[4, 4, 0, 0]} />
        )}
      </BarChart>
    </ResponsiveContainer>
  );
}
