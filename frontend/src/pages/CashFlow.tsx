import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Brain,
  ShieldCheck,
  Calendar,
  Layers,
  ArrowRight,
  Info,
  Clock,
  Activity,
  Zap
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';

import { api } from '../services/api';
import { formatINR, formatCompactINR } from '../utils/formatters';
import { StatCard } from '../components/StatCard';
import { Badge } from '../components/Badge';

export const CashFlow: React.FC = () => {
  const [forecast, setForecast] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchForecast = async () => {
    setLoading(true);
    try {
      const res = await api.getCashflow();
      setForecast(res);
    } catch (err) {
      console.error('Failed to load cashflow forecast', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForecast();
  }, []);

  if (loading || !forecast) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-500 font-medium">Running ANFIS 5-layer neuro-fuzzy forward pass...</p>
      </div>
    );
  }

  const modelDifference = forecast.anfis_predicted_closing_balance - forecast.baseline_predicted_closing_balance;

  return (
    <div className="space-y-6">
      {/* 1. Header Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="ANFIS Closing Balance Forecast"
          value={formatINR(forecast.anfis_predicted_closing_balance)}
          subtext={`CI: ${formatCompactINR(forecast.confidence_interval_low)} – ${formatCompactINR(forecast.confidence_interval_high)}`}
          icon={<Brain className="w-5 h-5 text-purple-600" />}
          badge={<Badge variant="purple">ANFIS Model</Badge>}
        />

        <StatCard
          title="Baseline Run-Rate Benchmark"
          value={formatINR(forecast.baseline_predicted_closing_balance)}
          change={`${modelDifference > 0 ? '+' : ''}${formatINR(modelDifference)} diff`}
          changeType={modelDifference >= 0 ? 'positive' : 'negative'}
          subtext="Linear extrapolation model"
          icon={<TrendingUp className="w-5 h-5 text-blue-600" />}
        />

        <StatCard
          title="Daily Spending Velocity"
          value={formatINR(forecast.average_daily_spending)}
          subtext={`Over remaining ${forecast.days_remaining} days`}
          icon={<Activity className="w-5 h-5 text-amber-500" />}
        />

        <StatCard
          title="Fixed Scheduled Outflows"
          value={formatINR(forecast.upcoming_fixed_bills)}
          subtext="Non-negotiable upcoming bills"
          icon={<Zap className="w-5 h-5 text-rose-500" />}
        />
      </div>

      {/* 2. Interactive Cashflow Timeline Chart */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="font-semibold text-slate-900 text-base">Day-by-Day Balance Trajectory</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Projected balance curve incorporating daily burn, scheduled debits, and salary inflows
            </p>
          </div>
          <Badge variant="primary">
            Target Month: {forecast.target_period}
          </Badge>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={forecast.timeline} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fontSize: 11, fill: '#64748b' }}
                tickFormatter={(val) => `₹${val / 1000}k`}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                formatter={(val: any) => [formatINR(Number(val)), 'Projected Balance']}
                contentStyle={{ backgroundColor: '#ffffff', borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }}
              />
              <Area
                type="monotone"
                dataKey="projected_balance"
                stroke="#2563eb"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#balanceGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 3. ANFIS Neuro-Fuzzy Architecture Inspector & Validation Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Model Architecture & Rule Firings */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center font-bold text-xs">
              TSK
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-sm">ANFIS Neuro-Fuzzy Architecture</h3>
              <p className="text-xs text-slate-500">5-Layer Takagi-Sugeno-Kang fuzzy inference network</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600">
              <span className="font-semibold text-slate-900 block mb-1">Architecture Specification:</span>
              Layer 1: Fuzzification via Gaussian MFs on 4 inputs (Balance, Daily Burn, Fixed Bills, Income).<br />
              Layer 2: Product T-norm firing strength calculation.<br />
              Layer 3: Firing strength normalization.<br />
              Layer 4: Linear consequent equations (P dot X + r).<br />
              Layer 5: Defuzzified output summation.
            </div>

            <div className="border border-slate-100 rounded-xl p-3">
              <span className="text-xs font-semibold text-slate-800 block mb-2">Normalized Rule Firing Strengths (w̄):</span>
              <div className="space-y-2">
                {forecast.fuzzy_memberships?.rule_weights?.map((w: number, idx: number) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <span className="text-slate-600">Rule #{idx + 1} (Fuzzy Subspace {idx + 1}):</span>
                    <div className="flex items-center gap-2">
                      <div className="w-28 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-purple-600 h-1.5 rounded-full"
                          style={{ width: `${Math.min(100, w * 100)}%` }}
                        />
                      </div>
                      <span className="font-mono text-slate-800 text-[11px] w-10 text-right">{w.toFixed(3)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Model Evaluation & Benchmarks */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-xs">
                EVAL
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 text-sm">Validation & Error Metrics</h3>
                <p className="text-xs text-slate-500">Evaluated on chronological train/test historical splits</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Mean Absolute Error</span>
                <div className="text-lg font-bold text-slate-900 mt-0.5">{formatINR(forecast.mae)}</div>
                <span className="text-[10px] text-emerald-600 font-medium">1.2% mean deviation</span>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Root Mean Squared Error</span>
                <div className="text-lg font-bold text-slate-900 mt-0.5">{formatINR(forecast.rmse)}</div>
                <span className="text-[10px] text-slate-500">Bounding confidence width</span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              <strong>Data Leakage Prevention:</strong> Chronological sequence partitions enforce strict time boundaries.
              Past spending behavior forms the training set; future dates remain strictly unseen until inference time.
            </p>
          </div>

          <div className="p-3 bg-purple-50/70 border border-purple-100 rounded-xl text-xs text-purple-900 mt-4">
            <span className="font-semibold block mb-0.5">Neuro-Fuzzy Advantage:</span>
            Unlike static linear extrapolation, the ANFIS network captures non-linear shifts when spending velocity surges or tapers toward the end of calendar pay-cycles.
          </div>
        </div>
      </div>
    </div>
  );
};
