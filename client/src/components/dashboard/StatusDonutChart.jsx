import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

export const StatusDonutChart = ({ data = [], totalVehicles = 48 }) => {
  const chartData = data.length > 0 ? data : [
    { name: 'Active', count: 38, percentage: 79, color: '#10B981' },
    { name: 'In Maintenance', count: 7, percentage: 15, color: '#F59E0B' },
    { name: 'Out of Service', count: 2, percentage: 4, color: '#EF4444' },
    { name: 'Decommissioned', count: 1, percentage: 2, color: '#6B7280' },
  ];

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-xs h-full flex flex-col justify-between">
      <h3 className="font-bold text-slate-800 text-sm tracking-tight mb-4">
        Vehicle Status Overview
      </h3>

      <div className="flex items-center justify-between gap-4 flex-1">
        {/* Donut Chart with Center Text */}
        <div className="relative w-44 h-44 shrink-0 flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                innerRadius={54}
                outerRadius={74}
                paddingAngle={4}
                dataKey="count"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-2xl font-extrabold text-slate-900 leading-tight">
              {totalVehicles}
            </span>
            <span className="text-[11px] font-semibold text-slate-400">Total Vehicles</span>
          </div>
        </div>

        {/* Legend List */}
        <div className="flex-1 space-y-2.5">
          {chartData.map((item) => (
            <div key={item.name} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="font-medium text-slate-600">{item.name}</span>
              </div>
              <span className="font-bold text-slate-900">
                {item.count} <span className="font-normal text-slate-400">({item.percentage}%)</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

