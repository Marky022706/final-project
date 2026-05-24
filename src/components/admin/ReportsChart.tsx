// src/components/admin/ReportsChart.tsx
import React from 'react';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid
} from 'recharts';
import Card from '../common/Card';

interface ChartProps {
  categoriesData: Array<{ name: string; value: number }>;
  booksData: Array<{ name: string; value: number; author: string }>;
}

// Diverse, highly distinguishable color palette
const CHART_COLORS = [
  '#059669', // Emerald
  '#0ea5e9', // Sky Blue
  '#f59e0b', // Amber
  '#8b5cf6', // Violet
  '#ef4444', // Red
  '#ec4899', // Pink
  '#14b8a6', // Teal
  '#f97316', // Orange
];

// Bar chart color palette (more vibrant for bars)
const BAR_COLORS = [
  '#059669', // Emerald
  '#0ea5e9', // Sky Blue
  '#f59e0b', // Amber
  '#8b5cf6', // Violet
  '#ef4444', // Red
];

// Custom tooltip for Pie chart
const PieTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const item = payload[0];
    return (
      <div className="bg-white border border-slate-100 rounded-xl shadow-lg px-3.5 py-2.5 text-xs">
        <p className="font-bold text-slate-700 capitalize mb-0.5">{item.name}</p>
        <p className="text-slate-500">
          <span className="font-extrabold text-slate-800">{item.value}</span> Borrows
        </p>
        <p className="text-slate-400 text-[10px]">
          {((item.value / payload[0].payload.total) * 100).toFixed(1)}% of total
        </p>
      </div>
    );
  }
  return null;
};

// Custom tooltip for Bar chart
const BarTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-slate-100 rounded-xl shadow-lg px-3.5 py-2.5 text-xs max-w-[200px]">
        <p className="font-bold text-slate-700 mb-0.5 leading-snug">{label}</p>
        <p className="text-slate-500">
          Total Checkouts: <span className="font-extrabold text-slate-800">{payload[0].value}</span>
        </p>
      </div>
    );
  }
  return null;
};

export const ReportsChart: React.FC<ChartProps> = ({ categoriesData, booksData }) => {
  // Compute total for percentage calculation
  const total = categoriesData.reduce((sum, item) => sum + item.value, 0);
  const categoriesWithTotal = categoriesData.map(item => ({ ...item, total }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
      {/* Category distribution - Pie Chart */}
      <Card className="flex flex-col h-[420px]">
        <div className="mb-4">
          <h4 className="text-sm font-bold text-slate-800">Borrowings by Genre/Category</h4>
          <p className="text-[11px] text-slate-400">Loan share by book genre — click segments for details</p>
        </div>

        <div className="flex-1 w-full relative min-h-0">
          {categoriesData.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-xs font-semibold">
              No categories statistics available yet.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <PieChart>
                <Pie
                  data={categoriesWithTotal}
                  cx="50%"
                  cy="43%"
                  innerRadius={60}
                  outerRadius={95}
                  paddingAngle={3}
                  dataKey="value"
                  label={(props: any) => {
                    const { cx, cy, midAngle, innerRadius, outerRadius, percent } = props;
                    if (!midAngle && midAngle !== 0) return null;
                    if (!percent || percent < 0.05) return null;
                    const RADIAN = Math.PI / 180;
                    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                    const x = cx + radius * Math.cos(-midAngle * RADIAN);
                    const y = cy + radius * Math.sin(-midAngle * RADIAN);
                    return (
                      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={10} fontWeight={700}>
                        {`${(percent * 100).toFixed(0)}%`}
                      </text>
                    );
                  }}
                  labelLine={false}
                >
                  {categoriesWithTotal.map((_, idx) => (
                    <Cell key={`cell-${idx}`} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Legend with colored dots and labels */}
        {categoriesData.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 border-t border-slate-50 pt-3">
            {categoriesData.map((item, idx) => (
              <div key={idx} className="flex items-center gap-1.5">
                <span 
                  className="h-2.5 w-2.5 rounded-full flex-shrink-0" 
                  style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}
                />
                <span className="text-[10px] font-bold text-slate-500 capitalize">
                  {item.name}
                </span>
                <span className="text-[10px] font-bold text-slate-400">
                  ({item.value})
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Top books - Bar Chart */}
      <Card className="flex flex-col h-[420px]">
        <div className="mb-1">
          <h4 className="text-sm font-bold text-slate-800">Top 5 Most Checked Out Books</h4>
          <p className="text-[11px] text-slate-400">Titles with highest cumulative circulation volume</p>
        </div>

        <div className="flex-1 w-full relative min-h-0">
          {booksData.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-xs font-semibold">
              No book borrowings recorded yet.
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height="88%" minWidth={0}>
                <BarChart
                  data={booksData}
                  margin={{ top: 14, right: 10, left: -25, bottom: 30 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: 600 }}
                    axisLine={false}
                    tickLine={false}
                    interval={0}
                    tickFormatter={(val) => val.length > 13 ? `${val.substring(0, 11)}…` : val}
                  />
                  <YAxis 
                    tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: 600 }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                    label={{ value: 'Checkouts', angle: -90, position: 'insideLeft', offset: 30, style: { fill: '#cbd5e1', fontSize: 9, fontWeight: 700 } }}
                  />
                  <Tooltip content={<BarTooltip />} />
                  <Bar 
                    dataKey="value" 
                    radius={[8, 8, 0, 0]}
                    maxBarSize={48}
                    name="Total Checkouts"
                  >
                    {booksData.map((_, idx) => (
                      <Cell 
                        key={`bar-cell-${idx}`} 
                        fill={BAR_COLORS[idx % BAR_COLORS.length]} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>

              {/* Color key legend below the bar chart */}
              <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 pt-1 border-t border-slate-50">
                {booksData.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-1.5">
                    <span 
                      className="h-2.5 w-2.5 rounded-sm flex-shrink-0" 
                      style={{ backgroundColor: BAR_COLORS[idx % BAR_COLORS.length] }}
                    />
                    <span className="text-[9px] font-bold text-slate-500 truncate max-w-[80px]" title={item.name}>
                      {item.name.length > 12 ? `${item.name.substring(0, 10)}…` : item.name}
                    </span>
                    <span className="text-[9px] text-slate-400 font-semibold">({item.value})</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </Card>
    </div>
  );
};

export default ReportsChart;
