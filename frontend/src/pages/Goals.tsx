import React, { useState, useEffect } from 'react';
import {
  Target,
  Plus,
  Compass,
  ArrowRight,
  Calendar,
  Sparkles,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Coins
} from 'lucide-react';

import { api } from '../services/api';
import { formatINR, formatCompactINR, formatDate, formatPercent } from '../utils/formatters';
import { StatCard } from '../components/StatCard';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';

interface GoalsProps {
  onNavigateTab: (tab: string, state?: any) => void;
}

export const Goals: React.FC<GoalsProps> = ({ onNavigateTab }) => {
  const [goals, setGoals] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Modals
  const [isGoalModalOpen, setIsGoalModalOpen] = useState<boolean>(false);
  const [isContributeModalOpen, setIsContributeModalOpen] = useState<boolean>(false);
  const [selectedGoal, setSelectedGoal] = useState<any | null>(null);

  // Form states
  const [goalForm, setGoalForm] = useState({
    name: '',
    target_amount: '',
    current_amount: '0',
    deadline: '',
    priority: 'medium',
    notes: ''
  });

  const [contributeForm, setContributeForm] = useState({
    amount: '',
    account_id: 1
  });

  const fetchGoals = async () => {
    setLoading(true);
    try {
      const [res, profileRes] = await Promise.all([
        api.getGoals(),
        api.getSettingsProfile()
      ]);
      setGoals(res);
      setAccounts(profileRes.accounts || []);
      if (profileRes.accounts?.length > 0) {
        setContributeForm(prev => ({ ...prev, account_id: profileRes.accounts[0].id }));
      }
    } catch (err) {
      console.error('Failed to load goals', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const handleCreateOrUpdateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name: goalForm.name,
        target_amount: Number(goalForm.target_amount),
        current_amount: Number(goalForm.current_amount || 0),
        deadline: goalForm.deadline,
        priority: goalForm.priority,
        notes: goalForm.notes
      };

      if (selectedGoal && !isContributeModalOpen) {
        await api.updateGoal(selectedGoal.id, payload);
      } else {
        await api.createGoal(payload);
      }

      setIsGoalModalOpen(false);
      setSelectedGoal(null);
      setGoalForm({
        name: '',
        target_amount: '',
        current_amount: '0',
        deadline: '',
        priority: 'medium',
        notes: ''
      });
      fetchGoals();
    } catch (err: any) {
      alert(err.message || 'Error saving goal');
    }
  };

  const handleContribute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoal) return;
    try {
      await api.contributeToGoal(selectedGoal.id, Number(contributeForm.amount), Number(contributeForm.account_id));
      setIsContributeModalOpen(false);
      setSelectedGoal(null);
      setContributeForm({ amount: '', account_id: accounts[0]?.id || 1 });
      fetchGoals();
    } catch (err: any) {
      alert(err.message || 'Error contributing to goal');
    }
  };

  const handleDeleteGoal = async (id: number) => {
    if (!confirm('Are you sure you want to remove this financial goal?')) return;
    try {
      await api.deleteGoal(id);
      fetchGoals();
    } catch (err: any) {
      alert(err.message || 'Error removing goal');
    }
  };

  const totalTarget = goals.reduce((acc, g) => acc + (g.target_amount || 0), 0);
  const totalSaved = goals.reduce((acc, g) => acc + (g.current_amount || 0), 0);
  const overallProgress = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;
  const totalNeededMonthly = goals.reduce((acc, g) => acc + (g.required_monthly_savings || 0), 0);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-500 font-medium">Computing savings timelines and feasibility projections...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Stat Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Consolidated Goal Targets"
          value={formatINR(totalTarget)}
          subtext={`${goals.length} active milestones`}
          icon={<Target className="w-5 h-5 text-blue-600" />}
        />

        <StatCard
          title="Current Saved Reserves"
          value={formatINR(totalSaved)}
          change={`${overallProgress.toFixed(1)}%`}
          changeType="positive"
          subtext={`Remaining: ${formatCompactINR(totalTarget - totalSaved)}`}
          icon={<Coins className="w-5 h-5 text-emerald-600" />}
        />

        <StatCard
          title="Required Monthly Allocation"
          value={formatINR(totalNeededMonthly)}
          subtext="To hit all target deadlines"
          icon={<Calendar className="w-5 h-5 text-indigo-600" />}
        />

        <StatCard
          title="Heuristic A* Optimization"
          value="Engine Ready"
          subtext="Minimize reduction inconvenience"
          badge={<Badge variant="purple">A* Search</Badge>}
        />
      </div>

      {/* 2. Goals Header & Grid */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="font-semibold text-slate-900 text-base">Financial Milestones</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Target amount, completion deadlines, and periodic savings contributions
            </p>
          </div>

          <button
            onClick={() => {
              setSelectedGoal(null);
              setGoalForm({
                name: '',
                target_amount: '',
                current_amount: '0',
                deadline: new Date(Date.now() + 180 * 24 * 3600 * 1000).toISOString().split('T')[0],
                priority: 'medium',
                notes: ''
              });
              setIsGoalModalOpen(true);
            }}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Goal</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {goals.map((g) => {
            const isHighPriority = g.priority === 'high';
            const isOnTrack = g.feasibility_status === 'On Track';

            return (
              <div
                key={g.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-sm text-slate-900">{g.name}</span>
                    <Badge variant={isHighPriority ? 'danger' : 'neutral'} size="sm">
                      {g.priority?.toUpperCase()} PRIORITY
                    </Badge>
                  </div>

                  <div className="text-2xl font-bold text-slate-900 mt-1 mb-1">
                    {formatINR(g.current_amount)}
                  </div>
                  <div className="text-xs text-slate-400 mb-3">
                    Target: {formatINR(g.target_amount)} • Deadline: {formatDate(g.deadline)}
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden mb-2">
                    <div
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 h-2.5 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, g.completion_percentage)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs mb-3">
                    <span className="font-semibold text-blue-600">{g.completion_percentage}% saved</span>
                    <span className="text-slate-400">{g.months_remaining} mos left</span>
                  </div>

                  {/* Periodic Requirement Box */}
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Needed Monthly:</span>
                      <span className="font-semibold text-slate-900">{formatINR(g.required_monthly_savings)}/mo</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-600 pt-0.5">
                      <span>Status:</span>
                      <Badge variant={isOnTrack ? 'success' : g.feasibility_status === 'Needs Adjustment' ? 'warning' : 'danger'} size="sm">
                        {g.feasibility_status}
                      </Badge>
                    </div>
                  </div>

                  {g.notes && (
                    <p className="text-[11px] text-slate-400 mt-2 line-clamp-2 italic">"{g.notes}"</p>
                  )}
                </div>

                {/* Actions Row */}
                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => {
                      setSelectedGoal(g);
                      setContributeForm({ amount: '', account_id: accounts[0]?.id || 1 });
                      setIsContributeModalOpen(true);
                    }}
                    className="flex-1 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-semibold transition-colors text-center"
                  >
                    Allocate Funds
                  </button>

                  <button
                    onClick={() => onNavigateTab('savings-planner', { preselectedGoalId: g.id })}
                    className="flex-1 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-semibold transition-colors text-center flex items-center justify-center gap-1"
                    title="Run A* budget search optimizer for this goal"
                  >
                    <Compass className="w-3.5 h-3.5" />
                    <span>A* Optimize</span>
                  </button>

                  <button
                    onClick={() => handleDeleteGoal(g.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MODAL 1: Create or Edit Goal */}
      <Modal
        isOpen={isGoalModalOpen}
        onClose={() => setIsGoalModalOpen(false)}
        title={selectedGoal ? 'Edit Savings Goal' : 'Create Savings Goal'}
        description="Establish target amount and timeline deadline"
      >
        <form onSubmit={handleCreateOrUpdateGoal} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Goal Name</label>
            <input
              type="text"
              required
              value={goalForm.name}
              onChange={(e) => setGoalForm({ ...goalForm, name: e.target.value })}
              placeholder="e.g. Emergency Fund Reserve"
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Target Amount (INR ₹)</label>
              <input
                type="number"
                step="1000"
                required
                value={goalForm.target_amount}
                onChange={(e) => setGoalForm({ ...goalForm, target_amount: e.target.value })}
                placeholder="₹1,00,000"
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Already Saved (INR ₹)</label>
              <input
                type="number"
                step="1000"
                value={goalForm.current_amount}
                onChange={(e) => setGoalForm({ ...goalForm, current_amount: e.target.value })}
                placeholder="₹0"
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Target Deadline</label>
              <input
                type="date"
                required
                value={goalForm.deadline}
                onChange={(e) => setGoalForm({ ...goalForm, deadline: e.target.value })}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Priority</label>
              <select
                value={goalForm.priority}
                onChange={(e) => setGoalForm({ ...goalForm, priority: e.target.value })}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
              >
                <option value="high">High Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="low">Low Priority</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Notes / Assumptions</label>
            <textarea
              rows={2}
              value={goalForm.notes}
              onChange={(e) => setGoalForm({ ...goalForm, notes: e.target.value })}
              placeholder="e.g. Stored in high-yield liquid mutual fund"
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsGoalModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs"
            >
              Save Goal
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: Contribute to Goal */}
      <Modal
        isOpen={isContributeModalOpen}
        onClose={() => setIsContributeModalOpen(false)}
        title={`Allocate Funds: ${selectedGoal?.name}`}
        description="Transfer funds from an active ledger account into this savings goal"
      >
        <form onSubmit={handleContribute} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Source Account</label>
            <select
              value={contributeForm.account_id}
              onChange={(e) => setContributeForm({ ...contributeForm, account_id: Number(e.target.value) })}
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>{a.name} ({formatINR(a.balance)})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Contribution Amount (INR ₹)</label>
            <input
              type="number"
              step="100"
              required
              value={contributeForm.amount}
              onChange={(e) => setContributeForm({ ...contributeForm, amount: e.target.value })}
              placeholder="e.g. 5000"
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsContributeModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs"
            >
              Confirm Allocation
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
