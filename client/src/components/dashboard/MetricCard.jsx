import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

export const MetricCard = ({
  title,
  value,
  trend,
  trendLabel = 'vs. last month',
  isPositive = true,
  icon: Icon,
  iconBgColor = 'bg-blue-500',
  iconColor = 'text-white',
}) => {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs hover:shadow-md transition-shadow flex items-start gap-4">
      {/* Icon badge */}
      <div className={`w-13 h-13 rounded-2xl ${iconBgColor} flex items-center justify-center ${iconColor} shrink-0 shadow-sm`}>
        <Icon className="w-6 h-6 stroke-[2.2]" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
        <p className="text-3xl font-extrabold text-slate-900 mt-1 tracking-tight leading-tight">
          {value}
        </p>
        
        {trend && (
          <div className="flex items-center gap-1.5 mt-2">
            <span
              className={`inline-flex items-center text-xs font-bold ${
                isPositive ? 'text-emerald-600' : 'text-amber-600'
              }`}
            >
              {isPositive ? <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5]" /> : <ArrowDownRight className="w-3.5 h-3.5 stroke-[2.5]" />}
              {trend}
            </span>
            <span className="text-[11px] text-slate-400 font-medium">{trendLabel}</span>
          </div>
        )}
      </div>
    </div>
  );
};

