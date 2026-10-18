import React, { useEffect, useState } from 'react';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  PieChart as PieIcon,
  Calendar,
  AlertTriangle,
  Sparkles,
  ChevronRight,
  ShieldAlert,
  CheckCircle2,
  Layers
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

import { api } from '../services/api';
import { formatINR, formatCompactINR, formatDate, formatPercent } from '../utils/formatters';
import { StatCard } from '../components/StatCard';
import { Badge } from '../components/Badge';

interface OverviewProps {
  onNavigateTab: (tab: string) => void;
  selectedPeriod: string;
}

const CATEGORY_COLORS = [
  '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b',
  '#ef4444', '#ec4899', '#06b6d4', '#64748b'
];

export const Overview: React.FC<OverviewProps> = ({ onNavigateTab, selectedPeriod }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOverview = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getOverview(selectedPeriod);
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load financial overview');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, [selectedPeriod]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-500 font-medium">Aggregating live ledger and intelligent models...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 bg-rose-50 border border-rose-200 rounded-2xl text-center">
        <AlertTriangle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
        <h3 className="text-base font-semibold text-rose-900">Unable to load dashboard</h3>
        <p className="text-sm text-rose-600 mt-1">{error}</p>
        <button
          onClick={fetchOverview}
          className="mt-4 px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-semibold hover:bg-rose-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Top Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Consolidated Liquid Balance"
          value={formatINR(data.liquid_balance)}
          subtext="Across checking, savings & cards"
          icon={<Wallet className="w-5 h-5 text-blue-600" />}
          badge={<Badge variant="primary">Active</Badge>}
        />

        <StatCard
          title={`Total Inflows (${data.period})`}
          value={formatINR(data.total_income)}
          change="+₹1,25,000 / mo"
          changeType="positive"
          subtext="Salary & credits"
          icon={<ArrowUpRight className="w-5 h-5 text-emerald-600" />}
        />

        <StatCard
          title="Period Expenditure"
          value={formatINR(data.total_expenses)}
          change={data.expense_delta_pct ? `${data.expense_delta_pct > 0 ? '+' : ''}${data.expense_delta_pct}% vs last mo` : 'Budget pacing'}
          changeType={data.expense_delta_pct > 0 ? 'negative' : 'positive'}
          subtext={`Budget Cap: ${formatCompactINR(data.budget_limit)}`}
          icon={<ArrowDownRight className="w-5 h-5 text-rose-600" />}
        />

        <StatCard
          title="ANFIS Month-End Forecast"
          value={formatINR(data.month_end_forecast)}
          change={`${data.savings_rate_pct}% savings rate`}
          changeType="positive"
          subtext="Neuro-fuzzy projection"
          icon={<TrendingUp className="w-5 h-5 text-purple-600" />}
        />
      </div>

      {/* 2. Prioritized PEAS Agent Recommendations Banner */}
      {data.recommendations && data.recommendations.length > 0 && (
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-6 shadow-md border border-indigo-950">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-indigo-300">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-base tracking-tight text-white flex items-center gap-2">
                  PEAS Agent Prioritized Recommendations
                  <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider bg-indigo-500/30 text-indigo-200 rounded-md border border-indigo-400/30">
                    Live Autonomous Insights
                  </span>
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Algorithmic advice combined across Prolog rules, Fuzzy controllers, and Minimax simulations.
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigateTab('copilot')}
              className="px-4 py-2 bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 shrink-0"
            >
              <span>Ask Copilot</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.recommendations.slice(0, 3).map((rec: any, idx: number) => (
              <div
                key={rec.id || idx}
                className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-semibold text-indigo-200 uppercase tracking-wider">
                      Priority #{rec.priority} • {rec.category}
                    </span>
                    <span className="text-xs font-bold text-emerald-400">
                      Save {formatINR(rec.estimated_monthly_savings)}/mo
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold text-white mb-1">{rec.title}</h4>
                  <p className="text-xs text-slate-300 line-clamp-2">{rec.rationale}</p>
                </div>
                {rec.suggested_action_url && (
                  <button
                    onClick={() => onNavigateTab(rec.suggested_action_url.replace('/', ''))}
                    className="mt-3 inline-flex items-center text-xs font-medium text-indigo-300 hover:text-white"
                  >
                    <span>Execute Strategy</span>
                    <ChevronRight className="w-3.5 h-3.5 ml-1" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Charts Row: 6-Month Income vs Expense Trend & Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Income vs Expense History */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-slate-900 text-base">Cash Flow Trajectory (Past 6 Months)</h3>
              <p className="text-xs text-slate-500 mt-0.5">Monthly inflows vs outflows with net surplus</p>
            </div>
            <button
              onClick={() => onNavigateTab('cashflow')}
              className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <span>View ANFIS Forecast</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.income_vs_expense_history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(val) => `₹${val / 1000}k`} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(val: any) => [formatINR(Number(val)), '']}
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }}
                />
                <Bar dataKey="income" name="Income" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={22} />
                <Bar dataKey="expense" name="Expenditure" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={22} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown Donut */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-slate-900 text-base">Spending Breakdown</h3>
                <p className="text-xs text-slate-500 mt-0.5">Distribution for {data.period}</p>
              </div>
              <button
                onClick={() => onNavigateTab('budgets')}
                className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <span>Budgets</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="h-48 w-full flex items-center justify-center">
              {data.category_breakdown && data.category_breakdown.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.category_breakdown}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={3}
                    >
                      {data.category_breakdown.map((_: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: any) => [formatINR(Number(val)), '']}
                      contentStyle={{ backgroundColor: '#ffffff', borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-xs text-slate-400">No expenses recorded for this period</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5 mt-2 max-h-36 overflow-y-auto">
            {data.category_breakdown?.slice(0, 4).map((c: any, idx: number) => (
              <div key={c.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: CATEGORY_COLORS[idx % CATEGORY_COLORS.length] }}
                  />
                  <span className="text-slate-600 truncate max-w-[120px]">{c.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-900">{formatINR(c.value)}</span>
                  <span className="text-slate-400 text-[10px]">({c.percentage}%)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Two Columns: Active Goals Progress & Upcoming Obligations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Goals Progress */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-slate-900 text-base">Target Savings Goals</h3>
              <p className="text-xs text-slate-500 mt-0.5">Progress toward financial milestones</p>
            </div>
            <button
              onClick={() => onNavigateTab('goals')}
              className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <span>Manage Goals</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-4">
            {data.goals && data.goals.length > 0 ? (
              data.goals.map((g: any) => (
                <div key={g.id} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-slate-900">{g.name}</span>
                    <span className="text-xs font-bold text-blue-600">{g.progress_pct}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden mb-2">
                    <div
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, g.progress_pct)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>Saved: {formatINR(g.current)}</span>
                    <span>Target: {formatINR(g.target)}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 text-center py-4">No active savings goals found.</p>
            )}
          </div>
        </div>

        {/* Upcoming Bills & Subscriptions */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-slate-900 text-base">Upcoming Recurring Obligations</h3>
              <p className="text-xs text-slate-500 mt-0.5">Due in the next 14 calendar days</p>
            </div>
            <button
              onClick={() => onNavigateTab('bills')}
              className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <span>Minimax Simulator</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {data.upcoming_bills && data.upcoming_bills.length > 0 ? (
              data.upcoming_bills.map((b: any) => (
                <div
                  key={b.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-xs">
                      {b.days_remaining}d
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-900">{b.name}</div>
                      <div className="text-[11px] text-slate-400">Due {formatDate(b.due_date)} • {b.provider}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-slate-900">{formatINR(b.amount)}</div>
                    <Badge variant={b.days_remaining <= 3 ? 'warning' : 'neutral'} size="sm">
                      {b.days_remaining <= 3 ? 'Due Soon' : 'Scheduled'}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 text-center py-6">No bills due in the next 14 days.</p>
            )}
          </div>
        </div>
      </div>

      {/* 5. Recent Transactions Table */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-slate-900 text-base">Recent Ledger Entries</h3>
            <p className="text-xs text-slate-500 mt-0.5">Real-time categorized records and neural anomaly checks</p>
          </div>
          <button
            onClick={() => onNavigateTab('transactions')}
            className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <span>View All Ledger</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider text-[10px]">
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Description</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3 text-right">Amount</th>
                <th className="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {data.recent_transactions?.map((t: any) => (
                <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-3 text-slate-500 whitespace-nowrap">{formatDate(t.date)}</td>
                  <td className="py-3 px-3 font-medium text-slate-900">
                    <div>{t.description}</div>
                    {t.merchant && <span className="text-[10px] text-slate-400">{t.merchant}</span>}
                  </td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[11px]">
                      {t.category}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span className={t.type === 'income' ? 'text-emerald-600 font-medium' : 'text-slate-600'}>
                      {t.type === 'income' ? 'Credit' : 'Debit'}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right font-bold whitespace-nowrap">
                    <span className={t.type === 'income' ? 'text-emerald-600' : 'text-slate-900'}>
                      {t.type === 'income' ? '+' : '-'}{formatINR(t.amount)}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center">
                    {t.is_anomaly ? (
                      <Badge variant="danger" size="sm">
                        Anomaly Flagged
                      </Badge>
                    ) : (
                      <Badge variant="neutral" size="sm">
                        Verified
                      </Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
