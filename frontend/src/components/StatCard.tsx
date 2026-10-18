import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  subtext?: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change,
  changeType = 'neutral',
  subtext,
  icon,
  badge
}) => {
  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-slate-500">{title}</span>
        {icon && (
          <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600">
            {icon}
          </div>
        )}
      </div>

      <div className="flex items-baseline justify-between">
        <div className="text-2xl font-bold tracking-tight text-slate-900">{value}</div>
        {badge}
      </div>

      {(change || subtext) && (
        <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
          {change && (
            <span className={`inline-flex items-center font-medium ${
              changeType === 'positive' 
                ? 'text-emerald-600' 
                : changeType === 'negative' 
                ? 'text-rose-600' 
                : 'text-slate-600'
            }`}>
              {changeType === 'positive' && <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />}
              {changeType === 'negative' && <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />}
              {changeType === 'neutral' && <Minus className="w-3.5 h-3.5 mr-0.5" />}
              {change}
            </span>
          )}
          {subtext && <span className="text-slate-400">{subtext}</span>}
        </div>
      )}
    </div>
  );
};
