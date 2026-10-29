import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export const MaintenanceTrendsChart = ({ data = [] }) => {
  const chartData = data.length > 0 ? data : [
    { month: 'Apr', scheduled: 7, completed: 5 },
    { month: 'May', scheduled: 8, completed: 7 },
    { month: 'Jun', scheduled: 10, completed: 7 },
    { month: 'Jul', scheduled: 10, completed: 8 },
    { month: 'Aug', scheduled: 13, completed: 10 },
    { month: 'Sep', scheduled: 13, completed: 13 },
    { month: 'Oct', scheduled: 17, completed: 15 },
  ];

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-xs h-full flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-slate-800 text-sm tracking-tight">
          Maintenance Trends
        </h3>
        
        {/* Legend */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            <span className="font-medium text-slate-600">Scheduled</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="font-medium text-slate-600">Completed</span>
          </div>
        </div>
      </div>

      <div className="h-52 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#64748B', fontSize: 11 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#64748B', fontSize: 11 }}
              domain={[0, 20]}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0F172A',
                border: 'none',
                borderRadius: '0.75rem',
                color: '#fff',
                fontSize: '12px',
              }}
              itemStyle={{ color: '#E2E8F0' }}
            />
            <Bar dataKey="scheduled" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={9} />
            <Bar dataKey="completed" fill="#10B981" radius={[4, 4, 0, 0]} barSize={9} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

