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

// Curated harmonious Green theme hues
const EMERALD_TINTS = [
  '#0f766e', // dark teal
  '#15803d', // municipal green
  '#16a34a', // emerald green
  '#34d399', // soft green
  '#6ee7b7', // light mint
  '#a7f3d0'  // pale mint
];

export const ReportsChart: React.FC<ChartProps> = ({ categoriesData, booksData }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
      {/* Category distribution - Pie Chart */}
      <Card className="flex flex-col h-[380px]">
        <div className="mb-4">
          <h4 className="text-sm font-bold text-slate-800">Borrowings by Genre/Category</h4>
          <p className="text-[11px] text-slate-400">Inventory loan share by book category</p>
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
                  data={categoriesData}
                  cx="50%"
                  cy="45%"
                  innerRadius={65}
                  outerRadius={95}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {categoriesData.map((_, idx) => (
                    <Cell key={`cell-${idx}`} fill={EMERALD_TINTS[idx % EMERALD_TINTS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => [`${value} Borrows`, 'Loans']}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Legend */}
        {categoriesData.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 border-t border-slate-50 pt-3 text-[10px] text-slate-500 font-bold">
            {categoriesData.map((item, idx) => (
              <div key={idx} className="flex items-center gap-1.5">
                <span 
                  className="h-2.5 w-2.5 rounded-full" 
                  style={{ backgroundColor: EMERALD_TINTS[idx % EMERALD_TINTS.length] }}
                />
                <span className="capitalize">{item.name} ({item.value})</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Top books - Bar Chart */}
      <Card className="flex flex-col h-[380px]">
        <div className="mb-4">
          <h4 className="text-sm font-bold text-slate-800">Top 5 Checked Out Books</h4>
          <p className="text-[11px] text-slate-400">Titles with cumulative high circulation volume</p>
        </div>

        <div className="flex-1 w-full relative min-h-0">
          {booksData.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-xs font-semibold">
              No book borrowings recorded yet.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <BarChart
                data={booksData}
                margin={{ top: 10, right: 10, left: -25, bottom: 25 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: 600 }}
                  axisLine={false}
                  tickLine={false}
                  interval={0}
                  tickFormatter={(val) => val.length > 12 ? `${val.substring(0, 10)}...` : val}
                />
                <YAxis 
                  tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: 600 }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip 
                  formatter={(value) => [`${value} Checkouts`, 'Quantity']}
                  labelFormatter={(label) => `Book: ${label}`}
                />
                <Bar 
                  dataKey="value" 
                  fill="#16a34a" 
                  radius={[8, 8, 0, 0]}
                  maxBarSize={45}
                >
                  {booksData.map((_, idx) => (
                    <Cell 
                      key={`bar-cell-${idx}`} 
                      fill={EMERALD_TINTS[idx % EMERALD_TINTS.length]} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </Card>
    </div>
  );
};

export default ReportsChart;
