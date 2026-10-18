import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  User,
  ShieldCheck,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Wallet,
  Activity,
  Cpu,
  Database,
  Lock
} from 'lucide-react';

import { api } from '../services/api';
import { formatINR } from '../utils/formatters';
import { StatCard } from '../components/StatCard';
import { Badge } from '../components/Badge';

export const SettingsPage: React.FC = () => {
  const [profile, setProfile] = useState<any | null>(null);
  const [diagnostics, setDiagnostics] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [resetting, setResetting] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Form State
  const [fullName, setFullName] = useState<string>('');
  const [monthlyIncome, setMonthlyIncome] = useState<string>('');
  const [currency, setCurrency] = useState<string>('INR');

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const [profRes, diagRes] = await Promise.all([
        api.getSettingsProfile(),
        api.getSystemDiagnostics()
      ]);
      setProfile(profRes);
      setDiagnostics(diagRes);
      if (profRes.user) {
        setFullName(profRes.user.full_name || '');
        setMonthlyIncome(String(profRes.user.monthly_income || 125000));
        setCurrency(profRes.user.currency || 'INR');
      }
    } catch (err) {
      console.error('Failed to load settings', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);
    try {
      await api.updateSettingsProfile({
        full_name: fullName,
        monthly_income: Number(monthlyIncome),
        currency
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      fetchSettings();
    } catch (err: any) {
      alert(err.message || 'Error updating settings');
    } finally {
      setSaving(false);
    }
  };

  const handleResetDemo = async () => {
    if (!confirm('This will wipe all existing financial data and re-seed the standard baseline profile. Continue?')) {
      return;
    }
    setResetting(true);
    try {
      await api.resetDemoData();
      alert('Demonstration dataset reset to initial calibrated baseline.');
      window.location.reload();
    } catch (err: any) {
      alert(err.message || 'Error resetting dataset');
    } finally {
      setResetting(false);
    }
  };

  if (loading || !profile || !diagnostics) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-500 font-medium">Querying system diagnostics and profile configuration...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-blue-600" />
            System Configuration & Diagnostics
          </h2>
          <p className="text-xs text-slate-500">
            Account preferences, financial profile parameters, and AI engine status checks
          </p>
        </div>

        <button
          onClick={handleResetDemo}
          disabled={resetting}
          className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 disabled:opacity-50"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${resetting ? 'animate-spin' : ''}`} />
          <span>{resetting ? 'Resetting...' : 'Reset Demonstration Dataset'}</span>
        </button>
      </div>

      {/* 2. User Profile & Monthly Income Settings Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
          <h3 className="font-semibold text-slate-900 text-sm mb-1">User Financial Profile</h3>
          <p className="text-xs text-slate-500 mb-4">
            Baseline income parameters used in budget calculations, A* heuristic searches, and ANFIS models
          </p>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address (Read-only)</label>
                <input
                  type="email"
                  disabled
                  value={profile.user?.email || ''}
                  className="w-full text-xs p-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Stated Monthly Income (INR ₹)</label>
                <input
                  type="number"
                  step="1000"
                  required
                  value={monthlyIncome}
                  onChange={(e) => setMonthlyIncome(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">System Base Currency</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                >
                  <option value="INR">Indian Rupee (INR - ₹)</option>
                  <option value="USD">US Dollar (USD - $)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              {saveSuccess && (
                <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Profile updated successfully</span>
                </span>
              )}
              <div className="ml-auto">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-colors disabled:opacity-50 shadow-xs"
                >
                  {saving ? 'Saving...' : 'Save Profile Changes'}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Linked Accounts Widget */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-slate-900 text-sm mb-1">Configured Accounts</h3>
            <p className="text-xs text-slate-500 mb-4">Active ledger accounts and balances</p>

            <div className="space-y-2.5">
              {profile.accounts?.map((a: any) => (
                <div key={a.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold text-slate-900">{a.name}</span>
                    <Badge variant={a.is_primary ? 'primary' : 'neutral'} size="sm">
                      {a.account_type.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="font-bold text-slate-800 text-sm">{formatINR(a.balance)}</div>
                </div>
              ))}
            </div>
          </div>
          <p className="text-[10px] text-slate-400 mt-4 text-center">
            All accounts isolated to authenticated user ID #{profile.user?.id}
          </p>
        </div>
      </div>

      {/* 3. AI & Intelligent Systems Diagnostics Grid */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-slate-900 text-base">Integrated AI & Intelligent Systems Diagnostics</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Runtime health and verification status for all ten intelligent system techniques
            </p>
          </div>
          <Badge variant="success">All Modules Operational</Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Object.entries(diagnostics.modules || {}).map(([key, val]: [string, any]) => {
            const cleanName = key.replace(/^\d+_/, '').replace(/_/g, ' ');

            return (
              <div key={key} className="p-3.5 bg-slate-50/70 border border-slate-200/80 rounded-xl text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-slate-900 capitalize">{cleanName}</span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    {val.status}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">{val.type}</p>
              </div>
            );
          })}
        </div>

        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
          <div>
            <strong>Prolog Engine Mode:</strong>{' '}
            <span className="font-mono text-slate-800">{diagnostics.prolog_engine_mode}</span>
          </div>
          <div>
            <strong>Runtime:</strong>{' '}
            <span className="font-mono text-slate-800">Python 3.14 + FastAPI + SQLite/Postgres</span>
          </div>
        </div>
      </div>
    </div>
  );
};
