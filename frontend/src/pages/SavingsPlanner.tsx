import React, { useState, useEffect } from 'react';
import {
  Compass,
  Layers,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sliders,
  Share2,
  Target,
  ShieldCheck,
  TrendingUp,
  GitFork
} from 'lucide-react';

import { api } from '../services/api';
import { formatINR, formatCompactINR, formatPercent } from '../utils/formatters';
import { StatCard } from '../components/StatCard';
import { Badge } from '../components/Badge';

interface SavingsPlannerProps {
  preselectedGoalId?: number;
}

export const SavingsPlanner: React.FC<SavingsPlannerProps> = ({ preselectedGoalId }) => {
  const [goals, setGoals] = useState<any[]>([]);
  const [selectedGoalId, setSelectedGoalId] = useState<number | null>(preselectedGoalId || null);
  const [monthsOverride, setMonthsOverride] = useState<string>('');
  const [strictMode, setStrictMode] = useState<boolean>(false);
  const [optimizing, setOptimizing] = useState<boolean>(false);
  const [planResult, setPlanResult] = useState<any | null>(null);

  // Dependency Graph & BFS Simulation state
  const [graphData, setGraphData] = useState<any | null>(null);
  const [salaryCutPct, setSalaryCutPct] = useState<number>(-20);
  const [simulatingImpact, setSimulatingImpact] = useState<boolean>(false);
  const [impactResult, setImpactResult] = useState<any | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const [goalsRes, graphRes] = await Promise.all([
          api.getGoals(),
          api.getDependencyGraph()
        ]);
        setGoals(goalsRes);
        setGraphData(graphRes);
        if (goalsRes.length > 0 && !selectedGoalId) {
          setSelectedGoalId(goalsRes[0].id);
        }
      } catch (err) {
        console.error('Failed to init savings planner', err);
      }
    };
    init();
  }, []);

  const handleRunAStar = async () => {
    if (!selectedGoalId) return;
    setOptimizing(true);
    try {
      const res = await api.optimizeSavingsPlan({
        goal_id: selectedGoalId,
        override_deadline_months: monthsOverride ? Number(monthsOverride) : undefined,
        strict_mode: strictMode
      });
      setPlanResult(res);
    } catch (err: any) {
      alert(err.message || 'Error executing A* search');
    } finally {
      setOptimizing(false);
    }
  };

  const handleSimulateImpact = async (pct: number) => {
    setSalaryCutPct(pct);
    setSimulatingImpact(true);
    try {
      const res = await api.simulateDependencyImpact({
        altered_node_id: 'income_primary',
        amount_change_percentage: pct
      });
      setImpactResult(res);
    } catch (err: any) {
      console.error('Impact simulation failed', err);
    } finally {
      setSimulatingImpact(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-6 rounded-2xl shadow-sm border border-indigo-950">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-blue-200">
              <Compass className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                A* Goal-Based Budget Search Engine
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-blue-500/30 text-blue-200 rounded border border-blue-400/30">
                  Admissible Heuristic Space Search
                </span>
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                Calculates the mathematically optimal, minimum-inconvenience expense reduction sequence to meet deadlines.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. A* Search Configuration Panel */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
        <h3 className="font-semibold text-slate-900 text-base mb-1">Target Milestone & Search Constraints</h3>
        <p className="text-xs text-slate-500 mb-4">
          Select target savings goal. Essential expenses (Rent, Medical) have 0% flexibility; discretionary expenses are weighted by inconvenience cost.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Select Savings Goal</label>
            <select
              value={selectedGoalId || ''}
              onChange={(e) => setSelectedGoalId(Number(e.target.value))}
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              {goals.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name} ({formatINR(g.target_amount)})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Override Deadline (Months, Optional)</label>
            <input
              type="number"
              min="1"
              max="60"
              value={monthsOverride}
              onChange={(e) => setMonthsOverride(e.target.value)}
              placeholder="Default from goal"
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
            />
          </div>

          <div className="flex flex-col justify-end">
            <button
              onClick={handleRunAStar}
              disabled={optimizing || !selectedGoalId}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
            >
              <Compass className={`w-4 h-4 ${optimizing ? 'animate-spin' : ''}`} />
              <span>{optimizing ? 'Searching State Space...' : 'Run A* Optimization'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. A* Search Output Results */}
      {planResult && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Result Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="A* Feasibility Status"
              value={planResult.is_feasible ? 'Feasible Strategy' : 'Unfeasible'}
              subtext={planResult.is_feasible ? 'Within budget floors' : 'Requires adjustment'}
              badge={
                <Badge variant={planResult.is_feasible ? 'success' : 'danger'}>
                  {planResult.is_feasible ? 'Optimal Plan Found' : 'Floor Conflict'}
                </Badge>
              }
            />

            <StatCard
              title="Monthly Savings Unlocked"
              value={formatINR(planResult.total_monthly_savings_unlocked)}
              subtext={`Required: ${formatINR(planResult.required_monthly_savings)}/mo`}
              icon={<TrendingUp className="w-5 h-5 text-emerald-600" />}
            />

            <StatCard
              title="New Monthly Surplus"
              value={formatINR(planResult.new_monthly_surplus)}
              subtext={`Original: ${formatINR(planResult.current_monthly_surplus)}/mo`}
              icon={<ShieldCheck className="w-5 h-5 text-blue-600" />}
            />

            <StatCard
              title="Inconvenience Cost g(n)"
              value={planResult.inconvenience_path_cost.toFixed(3)}
              subtext="Minimized path penalty"
              badge={<Badge variant="purple">A* Cost</Badge>}
            />
          </div>

          {/* Rationale & Action Plan */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl mb-4 text-xs">
              <span className="font-semibold text-slate-900 block mb-1">Optimization Diagnosis:</span>
              <p className="text-slate-600 leading-relaxed">{planResult.feasibility_notes}</p>
            </div>

            {planResult.reduction_steps && planResult.reduction_steps.length > 0 && (
              <div>
                <h4 className="font-semibold text-slate-900 text-sm mb-3">
                  Recommended Minimal-Inconvenience Reduction Sequence
                </h4>
                <div className="space-y-2.5">
                  {planResult.reduction_steps.map((step: any, idx: number) => (
                    <div
                      key={step.category_id || idx}
                      className="p-3.5 bg-white border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-300 transition-colors"
                    >
                      <div>
                        <div className="font-semibold text-slate-900 text-xs flex items-center gap-2">
                          <span>{idx + 1}. {step.category_name}</span>
                          <Badge variant="warning" size="sm">
                            Cut {step.reduction_percentage}%
                          </Badge>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">{step.rationale}</p>
                      </div>

                      <div className="text-right whitespace-nowrap">
                        <div className="text-xs text-slate-400">
                          {formatINR(step.current_spend)} → <span className="font-bold text-slate-900">{formatINR(step.proposed_spend)}</span>
                        </div>
                        <div className="text-xs font-bold text-emerald-600">
                          Save {formatINR(step.reduction_amount)}/mo
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Alternatives if unfeasible */}
            {planResult.alternative_options && (
              <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs space-y-2">
                <span className="font-semibold text-amber-900 block">Suggested Feasible Alternatives:</span>
                {planResult.alternative_options.map((alt: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between text-amber-800">
                    <span>• {alt.label}</span>
                    <button
                      onClick={() => {
                        if (alt.new_months) setMonthsOverride(String(alt.new_months));
                      }}
                      className="text-xs font-semibold text-blue-700 hover:underline"
                    >
                      Apply
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. Financial Dependency Graph & BFS Traversal Wave */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="font-semibold text-slate-900 text-base flex items-center gap-2">
              <GitFork className="w-5 h-5 text-indigo-600" />
              Financial Dependency Graph & Impact Propagation
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              BFS wave traversal maps how upstream income shocks propagate through intermediate budget pools to commitments
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Salary Shock:</span>
            {[-10, -20, -30].map((pct) => (
              <button
                key={pct}
                onClick={() => handleSimulateImpact(pct)}
                className={`px-2.5 py-1 text-xs rounded-lg font-medium border transition-colors ${
                  salaryCutPct === pct
                    ? 'bg-rose-50 text-rose-700 border-rose-200 font-bold'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {pct}%
              </button>
            ))}
          </div>
        </div>

        {/* Impact Wave Summary */}
        {impactResult ? (
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs mb-4">
            <div className="font-semibold text-slate-900 mb-1">BFS Wave Traversal Finding:</div>
            <p className="text-slate-600 leading-relaxed mb-3">{impactResult.cascade_summary}</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {impactResult.affected_nodes?.map((node: any) => (
                <div key={node.node_id} className="p-2.5 bg-white border border-slate-200 rounded-lg text-xs">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold text-slate-800">{node.label}</span>
                    <Badge variant={node.flexible ? 'warning' : 'primary'} size="sm">
                      Level {node.level}
                    </Badge>
                  </div>
                  <div className="text-[11px] text-slate-500 flex justify-between">
                    <span>Impact: <strong className="text-rose-600">{formatINR(node.estimated_impact)}</strong></span>
                    <span>Proj: {formatCompactINR(node.new_projected_amount)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-6 text-center text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 text-xs">
            Select a salary shock percentage above to trigger Breadth-First Search (BFS) impact propagation.
          </div>
        )}
      </div>
    </div>
  );
};
