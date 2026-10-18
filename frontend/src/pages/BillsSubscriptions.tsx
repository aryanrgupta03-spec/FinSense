import React, { useState, useEffect } from 'react';
import {
  CalendarCheck,
  Plus,
  Play,
  RotateCcw,
  ShieldCheck,
  TrendingDown,
  Sparkles,
  Zap,
  Edit2,
  Trash2,
  CheckCircle2,
  ChevronRight,
  GitPullRequest
} from 'lucide-react';

import { api } from '../services/api';
import { formatINR, formatCompactINR, formatDate } from '../utils/formatters';
import { StatCard } from '../components/StatCard';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';

export const BillsSubscriptions: React.FC = () => {
  const [bills, setBills] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [categories, setCategories] = useState<any[]>([]);

  // Modals
  const [isBillModalOpen, setIsBillModalOpen] = useState<boolean>(false);
  const [isSimModalOpen, setIsSimModalOpen] = useState<boolean>(false);
  const [selectedBill, setSelectedBill] = useState<any | null>(null);
  const [simResult, setSimResult] = useState<any | null>(null);
  const [simulating, setSimulating] = useState<boolean>(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    category_id: '',
    amount: '',
    billing_cycle: 'monthly',
    due_day: 1,
    next_due_date: new Date().toISOString().split('T')[0],
    provider: '',
    status: 'active',
    negotiable: true
  });

  const fetchBills = async () => {
    setLoading(true);
    try {
      const [res, catRes] = await Promise.all([
        api.getBills(),
        api.getCategories()
      ]);
      setBills(res);
      setCategories(catRes);
      if (catRes.length > 0 && !formData.category_id) {
        setFormData(prev => ({ ...prev, category_id: String(catRes[0].id) }));
      }
    } catch (err) {
      console.error('Failed to load bills', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBills();
  }, []);

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name: formData.name,
        category_id: formData.category_id ? Number(formData.category_id) : undefined,
        amount: Number(formData.amount),
        billing_cycle: formData.billing_cycle,
        due_day: Number(formData.due_day),
        next_due_date: formData.next_due_date,
        provider: formData.provider,
        status: formData.status,
        negotiable: formData.negotiable
      };

      if (selectedBill && !isSimModalOpen) {
        await api.updateBill(selectedBill.id, payload);
      } else {
        await api.createBill(payload);
      }

      setIsBillModalOpen(false);
      setSelectedBill(null);
      setFormData({
        name: '',
        category_id: String(categories[0]?.id || ''),
        amount: '',
        billing_cycle: 'monthly',
        due_day: 1,
        next_due_date: new Date().toISOString().split('T')[0],
        provider: '',
        status: 'active',
        negotiable: true
      });
      fetchBills();
    } catch (err: any) {
      alert(err.message || 'Error saving bill');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to remove this recurring bill?')) return;
    try {
      await api.deleteBill(id);
      fetchBills();
    } catch (err: any) {
      alert(err.message || 'Error removing bill');
    }
  };

  const handleRunMinimax = async (bill: any) => {
    setSelectedBill(bill);
    setSimulating(true);
    setIsSimModalOpen(true);
    try {
      const res = await api.simulateMinimax(bill.id, 3);
      setSimResult(res);
    } catch (err: any) {
      alert(err.message || 'Minimax simulation failed');
    } finally {
      setSimulating(false);
    }
  };

  const totalMonthly = bills.reduce((acc, b) => acc + (b.amount || 0), 0);
  const totalAnnual = totalMonthly * 12;
  const negotiableCount = bills.filter(b => b.negotiable).length;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-500 font-medium">Loading recurring subscriptions & Minimax game tree...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Header Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Monthly Recurring Commitments"
          value={formatINR(totalMonthly)}
          subtext={`${bills.length} active subscriptions`}
          icon={<CalendarCheck className="w-5 h-5 text-blue-600" />}
        />

        <StatCard
          title="Annualized Subscription Burn"
          value={formatINR(totalAnnual)}
          subtext="Total year-long fixed outflow"
          icon={<TrendingDown className="w-5 h-5 text-rose-500" />}
        />

        <StatCard
          title="Negotiable Subscriptions"
          value={`${negotiableCount} of ${bills.length}`}
          subtext="Eligible for retention offers"
          badge={<Badge variant="warning">{negotiableCount} Candidates</Badge>}
        />

        <StatCard
          title="Minimax Decision Simulator"
          value="3-Round Tree"
          subtext="Adversarial provider modeling"
          badge={<Badge variant="purple">Game Theory</Badge>}
        />
      </div>

      {/* 2. Subscriptions Ledger */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="font-semibold text-slate-900 text-base">Recurring Bills & Subscriptions</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Service contracts, renewal dates, and game-theoretic retention simulation
            </p>
          </div>

          <button
            onClick={() => {
              setSelectedBill(null);
              setFormData({
                name: '',
                category_id: String(categories[0]?.id || ''),
                amount: '',
                billing_cycle: 'monthly',
                due_day: 1,
                next_due_date: new Date().toISOString().split('T')[0],
                provider: '',
                status: 'active',
                negotiable: true
              });
              setIsBillModalOpen(true);
            }}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add Recurring Bill</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {bills.map((b) => (
            <div
              key={b.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-sm text-slate-900">{b.name}</span>
                  <Badge variant={b.negotiable ? 'purple' : 'neutral'} size="sm">
                    {b.negotiable ? 'Negotiable' : 'Fixed Utility'}
                  </Badge>
                </div>

                <div className="text-2xl font-bold text-slate-900 mt-1 mb-1">
                  {formatINR(b.amount)}
                  <span className="text-xs font-normal text-slate-400">/{b.billing_cycle}</span>
                </div>
                <div className="text-xs text-slate-400 mb-3">
                  Provider: {b.provider || 'Service Provider'} • Due Date: {formatDate(b.next_due_date)}
                </div>

                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Annual Cost:</span>
                    <span className="font-bold text-slate-900">{formatINR(b.amount * 12)}/yr</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Cycle Status:</span>
                    <span className="capitalize font-medium text-emerald-600">{b.status}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => handleRunMinimax(b)}
                  className="flex-1 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                  title="Run Minimax multi-round game tree negotiation simulator"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Simulate Minimax</span>
                </button>

                <button
                  onClick={() => {
                    setSelectedBill(b);
                    setFormData({
                      name: b.name,
                      category_id: String(b.category_id || categories[0]?.id || ''),
                      amount: String(b.amount),
                      billing_cycle: b.billing_cycle,
                      due_day: b.due_day,
                      next_due_date: b.next_due_date,
                      provider: b.provider || '',
                      status: b.status,
                      negotiable: b.negotiable
                    });
                    setIsBillModalOpen(true);
                  }}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => handleDelete(b.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL 1: Add or Edit Recurring Bill */}
      <Modal
        isOpen={isBillModalOpen}
        onClose={() => setIsBillModalOpen(false)}
        title={selectedBill ? 'Edit Recurring Obligation' : 'Add Recurring Bill / Subscription'}
        description="Enter contract provider details and monthly fees"
      >
        <form onSubmit={handleCreateOrUpdate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Bill / Service Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. JioFiber 300 Mbps"
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Provider</label>
              <input
                type="text"
                required
                value={formData.provider}
                onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                placeholder="e.g. Reliance Jio"
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Amount (INR ₹)</label>
              <input
                type="number"
                step="1"
                required
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="1199"
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Next Due Date</label>
              <input
                type="date"
                required
                value={formData.next_due_date}
                onChange={(e) => setFormData({ ...formData, next_due_date: e.target.value })}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>

            <div className="flex items-center pt-5">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={formData.negotiable}
                  onChange={(e) => setFormData({ ...formData, negotiable: e.target.checked })}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <span>Negotiable Retention Candidate</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsBillModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs"
            >
              Save Subscription
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: Minimax Game Tree Simulator Result */}
      <Modal
        isOpen={isSimModalOpen}
        onClose={() => setIsSimModalOpen(false)}
        title={`Minimax Game-Tree Simulation: ${selectedBill?.name}`}
        description="Multi-round game tree simulating User actions (MAX) against simulated Service Provider retention counter-moves (MIN)"
        maxWidth="2xl"
      >
        {simulating ? (
          <div className="py-12 text-center text-slate-400">
            <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Evaluating 3-round Minimax game tree with adversarial provider responses...
          </div>
        ) : simResult ? (
          <div className="space-y-5">
            {/* Preferred Strategy Hero Card */}
            <div className="p-4 bg-gradient-to-tr from-indigo-50 to-blue-50 border border-indigo-200 rounded-2xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-indigo-900 uppercase tracking-wider">
                  Minimax Optimal Strategy (MAX Payoff)
                </span>
                <Badge variant="purple" size="sm">
                  Depth {simResult.search_depth_evaluated} Evaluated
                </Badge>
              </div>

              <h4 className="text-base font-bold text-slate-900 mb-1">{simResult.best_strategy}</h4>
              <p className="text-xs text-slate-600 mb-3">{simResult.recommended_action}</p>

              <div className="grid grid-cols-2 gap-3 text-xs border-t border-indigo-200/60 pt-3">
                <div>
                  <span className="text-slate-500 block text-[10px]">Projected Cost:</span>
                  <span className="font-bold text-slate-900">{formatINR(simResult.projected_monthly_cost)}/mo</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Estimated Annual Savings:</span>
                  <span className="font-bold text-emerald-600">+{formatINR(simResult.estimated_annual_savings)}/yr</span>
                </div>
              </div>
            </div>

            {/* Strategy Comparison Table */}
            <div>
              <h5 className="font-semibold text-slate-900 text-xs mb-2">Comparative Strategy Payoff Table</h5>
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">Strategy</th>
                      <th className="py-2.5 px-3">Monthly Cost</th>
                      <th className="py-2.5 px-3 text-right">Annual Savings</th>
                      <th className="py-2.5 px-3 text-center">Friction</th>
                      <th className="py-2.5 px-3 text-right">Utility</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {simResult.strategy_comparison?.map((opt: any, idx: number) => (
                      <tr key={idx} className={idx === 0 ? 'bg-indigo-50/40 font-medium' : ''}>
                        <td className="py-2.5 px-3 font-semibold text-slate-900">{opt.strategy}</td>
                        <td className="py-2.5 px-3">{formatINR(opt.projected_monthly_cost)}</td>
                        <td className="py-2.5 px-3 text-right text-emerald-600 font-bold">
                          +{formatINR(opt.annual_savings)}
                        </td>
                        <td className="py-2.5 px-3 text-center text-[11px] text-slate-500">{opt.friction_rating}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-xs">{opt.utility_score.toFixed(0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Disclaimer */}
            <p className="text-[11px] text-slate-400 italic">
              * Note: Provider counter-offers (retention discounts, plan matches) are algorithmic simulations based on prevailing market retention policies. No real external provider cancellation is initiated without explicit authorization.
            </p>
          </div>
        ) : null}
      </Modal>
    </div>
  );
};
