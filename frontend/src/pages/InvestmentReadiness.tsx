import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  TrendingUp,
  Brain,
  Sliders,
  AlertTriangle,
  Info,
  CheckCircle2,
  Lock,
  Layers
} from 'lucide-react';

import { api } from '../services/api';
import { formatINR, formatPercent } from '../utils/formatters';
import { StatCard } from '../components/StatCard';
import { Badge } from '../components/Badge';

export const InvestmentReadiness: React.FC = () => {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Sliders state
  const [emergencyMonths, setEmergencyMonths] = useState<number>(4.5);
  const [expenseStability, setExpenseStability] = useState<number>(78);
  const [goalProgress, setGoalProgress] = useState<number>(65);
  const [monthlySurplus, setMonthlySurplus] = useState<number>(35000);

  const fetchAssessment = async (ef?: number, stab?: number, gp?: number, surp?: number) => {
    try {
      const res = await api.getInvestmentReadiness({
        emergency_months: ef !== undefined ? ef : emergencyMonths,
        expense_stability: stab !== undefined ? stab : expenseStability,
        goal_progress: gp !== undefined ? gp : goalProgress,
        monthly_surplus: surp !== undefined ? surp : monthlySurplus
      });
      setData(res);
      if (loading) {
        setEmergencyMonths(res.inputs.emergency_coverage_months);
        setExpenseStability(res.inputs.expense_stability_score);
        setGoalProgress(res.inputs.goal_progress_pct);
        setMonthlySurplus(res.inputs.monthly_surplus_inr);
      }
    } catch (err) {
      console.error('Failed to load investment readiness', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssessment();
  }, []);

  const handleSliderChange = (ef: number, stab: number, gp: number, surp: number) => {
    setEmergencyMonths(ef);
    setExpenseStability(stab);
    setGoalProgress(gp);
    setMonthlySurplus(surp);
    fetchAssessment(ef, stab, gp, surp);
  };

  if (loading || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-500 font-medium">Evaluating dual Mamdani vs Sugeno fuzzy inference systems...</p>
      </div>
    );
  }

  const isHighlyReady = data.mamdani_status === 'Highly Ready';
  const isModerate = data.mamdani_status === 'Moderate';
  const isNotReady = data.mamdani_status === 'Not Ready';

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 text-white p-6 rounded-2xl shadow-sm border border-slate-800">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-indigo-300">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
              Dual Fuzzy Investment Readiness Engine
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-indigo-500/30 text-indigo-200 rounded border border-indigo-400/30">
                Mamdani vs Sugeno FIS
              </span>
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              Evaluates emergency reserves, expense volatility, and liquid surplus to classify preparedness and calculate deployable capital.
            </p>
          </div>
        </div>
      </div>

      {/* 2. Interactive Parameter Sliders */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
        <h3 className="font-semibold text-slate-900 text-sm mb-1 flex items-center gap-2">
          <Sliders className="w-4 h-4 text-blue-600" />
          <span>Calibrate Financial Risk Parameters</span>
        </h3>
        <p className="text-xs text-slate-500 mb-6">
          Adjust inputs dynamically to observe side-by-side behavioral divergence between Mamdani and Sugeno inference
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Emergency Fund Coverage */}
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="font-semibold text-slate-700">Emergency Fund Coverage</span>
              <span className="font-bold text-blue-600">{emergencyMonths} months</span>
            </div>
            <input
              type="range"
              min="0"
              max="10"
              step="0.5"
              value={emergencyMonths}
              onChange={(e) => handleSliderChange(Number(e.target.value), expenseStability, goalProgress, monthlySurplus)}
              className="w-full accent-blue-600 cursor-pointer"
            />
            <span className="text-[10px] text-slate-400 block mt-1">Benchmark: 3 to 6 months</span>
          </div>

          {/* Expense Stability */}
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="font-semibold text-slate-700">Expense Stability Score</span>
              <span className="font-bold text-blue-600">{expenseStability}/100</span>
            </div>
            <input
              type="range"
              min="10"
              max="100"
              step="5"
              value={expenseStability}
              onChange={(e) => handleSliderChange(emergencyMonths, Number(e.target.value), goalProgress, monthlySurplus)}
              className="w-full accent-blue-600 cursor-pointer"
            />
            <span className="text-[10px] text-slate-400 block mt-1">Inverse CV of monthly spending</span>
          </div>

          {/* Goal Progress */}
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="font-semibold text-slate-700">Goal Savings Progress</span>
              <span className="font-bold text-blue-600">{goalProgress}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={goalProgress}
              onChange={(e) => handleSliderChange(emergencyMonths, expenseStability, Number(e.target.value), monthlySurplus)}
              className="w-full accent-blue-600 cursor-pointer"
            />
            <span className="text-[10px] text-slate-400 block mt-1">Pace toward target milestones</span>
          </div>

          {/* Monthly Discretionary Surplus */}
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="font-semibold text-slate-700">Monthly Surplus (INR)</span>
              <span className="font-bold text-blue-600">{formatINR(monthlySurplus)}</span>
            </div>
            <input
              type="range"
              min="2000"
              max="80000"
              step="1000"
              value={monthlySurplus}
              onChange={(e) => handleSliderChange(emergencyMonths, expenseStability, goalProgress, Number(e.target.value))}
              className="w-full accent-blue-600 cursor-pointer"
            />
            <span className="text-[10px] text-slate-400 block mt-1">Available after essential obligations</span>
          </div>
        </div>
      </div>

      {/* 3. Side-by-Side Dual FIS Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* MODEL A: Mamdani FIS (Linguistic Readiness) */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-xs">
                  MAM
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 text-sm">Mamdani Fuzzy Inference System</h3>
                  <p className="text-xs text-slate-500">Linguistic classification & centroid defuzzification</p>
                </div>
              </div>
              <Badge
                variant={isHighlyReady ? 'success' : isModerate ? 'primary' : isNotReady ? 'danger' : 'warning'}
              >
                {data.mamdani_status}
              </Badge>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl mb-4 text-center">
              <span className="text-xs text-slate-500 block mb-1">Mamdani Readiness Score:</span>
              <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                {data.mamdani_readiness_score}
                <span className="text-sm font-normal text-slate-400"> / 100</span>
              </span>
              <div className="w-full bg-slate-200 rounded-full h-2 mt-3 overflow-hidden">
                <div
                  className={`h-2 rounded-full ${
                    isHighlyReady ? 'bg-emerald-500' : isModerate ? 'bg-blue-600' : isNotReady ? 'bg-rose-500' : 'bg-amber-500'
                  }`}
                  style={{ width: `${data.mamdani_readiness_score}%` }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-800 block">Active Mamdani Linguistic Rules:</span>
              {data.mamdani_active_rules_detailed?.slice(0, 3).map((r: any, idx: number) => (
                <div key={idx} className="p-2.5 bg-slate-50/70 border border-slate-100 rounded-lg text-xs">
                  <div className="flex justify-between font-mono text-[10px] text-blue-600 mb-0.5">
                    <span>{r.rule}</span>
                    <span>Strength: {r.strength}</span>
                  </div>
                  <p className="text-slate-600 text-[11px]">{r.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400">
            Centroid Defuzzification over fuzzy sets: Not Ready (0-30), Emerging (25-55), Moderate (45-75), Highly Ready (70-100).
          </div>
        </div>

        {/* MODEL B: Sugeno FIS (Crisp Numeric Surplus Allocation) */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs">
                  SUG
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 text-sm">Sugeno Fuzzy Inference System</h3>
                  <p className="text-xs text-slate-500">First-order crisp investable surplus calculation</p>
                </div>
              </div>
              <Badge variant="success">Numeric Actionable</Badge>
            </div>

            <div className="p-4 bg-emerald-50/60 border border-emerald-100 rounded-xl mb-4 text-center">
              <span className="text-xs text-emerald-800 block mb-1">Recommended Deployable Surplus:</span>
              <span className="text-3xl font-extrabold text-emerald-950 tracking-tight">
                {formatINR(data.sugeno_investable_surplus)}
                <span className="text-xs font-normal text-emerald-700"> / month</span>
              </span>
              <div className="flex justify-between items-center text-xs text-emerald-800 mt-2 pt-2 border-t border-emerald-200/60">
                <span>Hard Safety Ceiling (70% Max):</span>
                <span className="font-bold">{formatINR(data.sugeno_safety_ceiling)}/mo</span>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-800 block">Active Sugeno Weighted Consequents:</span>
              {data.sugeno_active_rules_detailed?.slice(0, 3).map((r: any, idx: number) => (
                <div key={idx} className="p-2.5 bg-slate-50/70 border border-slate-100 rounded-lg text-xs">
                  <div className="flex justify-between font-mono text-[10px] text-emerald-700 mb-0.5">
                    <span>{r.rule}</span>
                    <span>Weight: {r.weight}</span>
                  </div>
                  <p className="text-slate-600 text-[11px]">{r.description} (Allocated: {formatINR(r.allocated_crisp_inr)})</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400">
            Weighted Average Defuzzification $z = \sum w_i z_i / \sum w_i$ strictly bounded by liquidity reserve preservation.
          </div>
        </div>
      </div>

      {/* 4. Comparative Synthesis & Disclaimers */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
        <h4 className="font-semibold text-slate-900 text-sm mb-2">Comparative System Analysis</h4>
        <p className="text-xs text-slate-600 leading-relaxed mb-4">{data.comparison_analysis}</p>

        <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block mb-0.5">Statutory Financial Disclaimer:</span>
            {data.disclaimer}
          </div>
        </div>
      </div>
    </div>
  );
};
