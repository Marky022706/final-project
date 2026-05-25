// src/components/admin/OverdueChart.tsx
import React from 'react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip 
} from 'recharts';
import Card from '../common/Card';

interface OverdueChartProps {
  revenueData: Array<{ month: string; revenue: number; payments: number }>;
}

export const OverdueChart: React.FC<OverdueChartProps> = ({ revenueData }) => {
  return (
    <Card className="flex flex-col h-[340px] animate-fade-in">
      <div className="mb-4">
        <h4 className="text-base font-bold text-slate-800">Fines Collection Revenue</h4>
        <p className="text-xs text-slate-400">Monthly fines collection history for the last 6 months</p>
      </div>

      <div className="flex-1 w-full relative min-h-0">
        {revenueData.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-xs font-semibold">
            No fines revenue datasets available.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <AreaChart
              data={revenueData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis 
                dataKey="month" 
                tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(val) => `₱${val}`}
              />
              <Tooltip 
                formatter={(value) => [`₱${new Intl.NumberFormat('en-PH', { minimumFractionDigits: 2 }).format(Number(value))}`, 'Revenue Collected']}
                labelFormatter={(label) => `Month: ${label}`}
              />
              <Area 
                type="monotone" 
                dataKey="revenue" 
                stroke="#10b981" 
                strokeWidth={2.5}
                fillOpacity={1} 
                fill="url(#colorRevenue)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
};

export default OverdueChart;
