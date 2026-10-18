import React, { useState, useEffect } from 'react';
import {
  PieChart,
  Plus,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  Layers,
  Edit2,
  Trash2,
  ShieldAlert,
  Flame,
  Info
} from 'lucide-react';

import { api } from '../services/api';
import { formatINR, formatCompactINR, formatPercent } from '../utils/formatters';
import { StatCard } from '../components/StatCard';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';

interface BudgetsProps {
  selectedPeriod: string;
}

export const Budgets: React.FC<BudgetsProps> = ({ selectedPeriod }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [categories, setCategories] = useState<any[]>([]);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingBudget, setEditingBudget] = useState<any | null>(null);
  const [formData, setFormData] = useState({
    category_id: '',
    limit_amount: ''
  });

  const fetchBudgets = async () => {
    setLoading(true);
    try {
      const [res, catRes] = await Promise.all([
        api.getBudgets(selectedPeriod),
        api.getCategories()
      ]);
      setData(res);
      setCategories(catRes);
      if (catRes.length > 0 && !formData.category_id) {
        setFormData(prev => ({ ...prev, category_id: String(catRes[0].id) }));
      }
    } catch (err) {
      console.error('Failed to fetch budgets', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgets();
  }, [selectedPeriod]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingBudget) {
        await api.updateBudget(editingBudget.id, {
          limit_amount: Number(formData.limit_amount)
        });
      } else {
        await api.createBudget({
          category_id: Number(formData.category_id),
          period: selectedPeriod,
          limit_amount: Number(formData.limit_amount)
        });
      }
      setIsModalOpen(false);
      setEditingBudget(null);
      setFormData({ category_id: String(categories[0]?.id || ''), limit_amount: '' });
      fetchBudgets();
    } catch (err: any) {
      alert(err.message || 'Error saving budget');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this category budget?')) return;
    try {
      await api.deleteBudget(id);
      fetchBudgets();
    } catch (err: any) {
      alert(err.message || 'Error removing budget');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-500 font-medium">Evaluating category caps and Prolog rules...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Header Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Budget Allocation"
          value={formatINR(data?.total_budget)}
          subtext={`Period: ${data?.period}`}
          icon={<PieChart className="w-5 h-5 text-blue-600" />}
        />

        <StatCard
          title="Expended So Far"
          value={formatINR(data?.total_spent)}
          change={formatPercent((data?.total_spent / max(1, data?.total_budget)) * 100)}
          changeType={data?.total_spent > data?.total_budget ? 'negative' : 'positive'}
          subtext={`Remaining: ${formatCompactINR(data?.total_remaining)}`}
          icon={<TrendingDown className="w-5 h-5 text-rose-600" />}
        />

        <StatCard
          title="Period Burn Rate"
          value={`${data?.burn_rate}x`}
          change={data?.burn_rate > 1.2 ? 'Above Pro-Rata' : 'Normal Pacing'}
          changeType={data?.burn_rate > 1.2 ? 'negative' : 'positive'}
          subtext="Speed relative to calendar pace"
          icon={<Flame className="w-5 h-5 text-amber-500" />}
        />

        <StatCard
          title="Fuzzy Controller Pacing"
          value={data?.fuzzy_alert_status || 'Normal'}
          subtext={`Urgency Score: ${data?.fuzzy_urgency_score}/100`}
          badge={
            <Badge
              variant={
                data?.fuzzy_alert_status === 'Comfortable'
                  ? 'success'
                  : data?.fuzzy_alert_status === 'Caution'
                  ? 'warning'
                  : 'danger'
              }
            >
              {data?.fuzzy_alert_status}
            </Badge>
          }
        />
      </div>

      {/* 2. Prolog Financial Reasoning Audit Banner */}
      {data?.prolog_findings && data.prolog_findings.length > 0 && (
        <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-800">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-amber-950 flex items-center gap-2">
                Prolog First-Order Logic Inferences
                <span className="text-[10px] font-mono font-bold bg-amber-200/60 text-amber-900 px-1.5 py-0.5 rounded">
                  SLD Resolution
                </span>
              </h3>
              <p className="text-xs text-amber-800">
                Formal rules engine verified live financial facts against specified constraints.
              </p>
            </div>
          </div>

          <div className="space-y-2 mt-2">
            {data.prolog_findings.map((finding: any, idx: number) => (
              <div
                key={idx}
                className="bg-white/80 rounded-xl p-3 border border-amber-200/60 text-xs flex items-start gap-2.5"
              >
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="font-semibold text-slate-900 flex items-center justify-between">
                    <span>{finding.rule_name}</span>
                    <Badge variant={finding.severity === 'critical' ? 'danger' : 'warning'} size="sm">
                      {finding.severity.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-slate-600 mt-0.5">{finding.inferred_explanation}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Category Budgets Grid */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="font-semibold text-slate-900 text-base">Category Budget Utilization</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Live consumption tracking with projected month-end burn calculations
            </p>
          </div>

          <button
            onClick={() => {
              setEditingBudget(null);
              setFormData({ category_id: String(categories[0]?.id || ''), limit_amount: '' });
              setIsModalOpen(true);
            }}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Set Category Budget</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data?.budgets?.map((b: any) => {
            const isBreached = b.status === 'exceeded';
            const isApproaching = b.status === 'approaching';

            return (
              <div
                key={b.id}
                className={`p-4 rounded-xl border transition-all duration-200 ${
                  isBreached
                    ? 'border-rose-200 bg-rose-50/30'
                    : isApproaching
                    ? 'border-amber-200 bg-amber-50/20'
                    : 'border-slate-200/80 bg-white hover:border-slate-300'
                }`}
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-slate-900">{b.category_name}</span>
                    <Badge variant={b.is_essential ? 'primary' : 'neutral'} size="sm">
                      {b.is_essential ? 'Essential' : 'Discretionary'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditingBudget(b);
                        setFormData({ category_id: String(b.category_id), limit_amount: String(b.limit_amount) });
                        setIsModalOpen(true);
                      }}
                      className="p-1 text-slate-400 hover:text-slate-700 rounded-md"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(b.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded-md"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Amount Details */}
                <div className="flex items-baseline justify-between mb-2">
                  <div>
                    <span className="text-lg font-bold text-slate-900">{formatINR(b.spent_amount)}</span>
                    <span className="text-xs text-slate-400"> of {formatCompactINR(b.limit_amount)}</span>
                  </div>
                  <Badge variant={isBreached ? 'danger' : isApproaching ? 'warning' : 'success'} size="sm">
                    {b.percentage_consumed}%
                  </Badge>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden mb-3">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      isBreached ? 'bg-rose-500' : isApproaching ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, b.percentage_consumed)}%` }}
                  />
                </div>

                {/* Projections & Analytics */}
                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500 border-t border-slate-100 pt-2.5">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Daily Velocity:</span>
                    <span className="font-semibold text-slate-700">{formatINR(b.average_daily_spending)}/day</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Projected Month-End:</span>
                    <span className={`font-semibold ${b.projected_month_end_spending > b.limit_amount ? 'text-rose-600' : 'text-slate-700'}`}>
                      {formatINR(b.projected_month_end_spending)}
                    </span>
                  </div>
                </div>

                {isBreached && (
                  <div className="mt-2.5 p-2 bg-rose-50 border border-rose-200/80 rounded-lg text-[10px] text-rose-700 font-medium">
                    Overrun: {formatINR(b.overrun_amount)} over allocated cap
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* MODAL: Set / Edit Category Budget */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingBudget ? 'Update Budget Cap' : 'Establish Category Budget'}
        description={`Configure monthly expenditure cap for ${selectedPeriod}`}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Expense Category</label>
            <select
              disabled={!!editingBudget}
              value={formData.category_id}
              onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name} ({c.is_essential ? 'Essential' : 'Discretionary'})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Monthly Limit (INR ₹)</label>
            <input
              type="number"
              step="100"
              required
              value={formData.limit_amount}
              onChange={(e) => setFormData({ ...formData, limit_amount: e.target.value })}
              placeholder="e.g. 15000"
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs"
            >
              Save Budget
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

function max(a: number, b: number): number {
  return a > b ? a : b;
}
