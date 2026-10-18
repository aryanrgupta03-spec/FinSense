import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  FileSpreadsheet,
  Calendar,
  CheckCircle2,
  TrendingUp,
  Brain,
  ShieldCheck,
  Activity,
  Layers
} from 'lucide-react';

import { api } from '../services/api';
import { formatINR, formatCompactINR, formatPercent } from '../utils/formatters';
import { StatCard } from '../components/StatCard';
import { Badge } from '../components/Badge';

export const Reports: React.FC = () => {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await api.getReportsSummary();
      setData(res);
    } catch (err) {
      console.error('Failed to load reports summary', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleDownloadCSV = () => {
    window.open(api.getExportCSVUrl(), '_blank');
  };

  const handleDownloadPDF = () => {
    window.open(api.getExportPDFUrl(), '_blank');
  };

  if (loading || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-500 font-medium">Generating financial audit reports and statements...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Reporting Period"
          value={data.report_period}
          subtext="Statement cycle"
          icon={<Calendar className="w-5 h-5 text-blue-600" />}
        />

        <StatCard
          title="Period Inflows"
          value={formatINR(data.total_income)}
          subtext="Net recognized income"
          icon={<TrendingUp className="w-5 h-5 text-emerald-600" />}
        />

        <StatCard
          title="Period Outflows"
          value={formatINR(data.total_expenses)}
          subtext="Debited expenses"
          icon={<Activity className="w-5 h-5 text-rose-500" />}
        />

        <StatCard
          title="Net Savings Retention"
          value={formatINR(data.net_savings)}
          change={`${data.savings_rate_pct}% rate`}
          changeType="positive"
          subtext="Preserved capital"
          badge={<Badge variant="success">Positive</Badge>}
        />
      </div>

      {/* 2. Download Statement Action Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-semibold text-slate-900 text-sm">Download Verified Statements</h3>
          <p className="text-xs text-slate-500">
            Export comprehensive multi-account ledgers, budgets, and audit logs
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleDownloadCSV}
            className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition-colors flex items-center gap-2"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Download CSV Statement</span>
          </button>

          <button
            onClick={handleDownloadPDF}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-2 shadow-xs"
          >
            <Download className="w-4 h-4" />
            <span>Download PDF Report</span>
          </button>
        </div>
      </div>

      {/* 3. Budget Adherence Table */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
        <h3 className="font-semibold text-slate-900 text-base mb-1">Category Budget Adherence Report</h3>
        <p className="text-xs text-slate-500 mb-4">
          Allocated limit vs actual expenditures and adherence percentages
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 uppercase text-[10px]">
                <th className="py-2.5 px-3">Expense Category</th>
                <th className="py-2.5 px-3">Monthly Cap</th>
                <th className="py-2.5 px-3">Actual Expended</th>
                <th className="py-2.5 px-3">Adherence %</th>
                <th className="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {data.budget_adherence?.map((b: any, idx: number) => (
                <tr key={idx} className="hover:bg-slate-50/50">
                  <td className="py-3 px-3 font-semibold text-slate-900">{b.category}</td>
                  <td className="py-3 px-3">{formatINR(b.limit)}</td>
                  <td className="py-3 px-3 font-bold">{formatINR(b.spent)}</td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-1.5 rounded-full ${b.adherence_pct > 100 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                          style={{ width: `${Math.min(100, b.adherence_pct)}%` }}
                        />
                      </div>
                      <span>{b.adherence_pct}%</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <Badge variant={b.status === 'Overrun' ? 'danger' : 'success'} size="sm">
                      {b.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Forecast vs Actual History & Model Performance Benchmarks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Forecast vs Actual History */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
          <h3 className="font-semibold text-slate-900 text-sm mb-1">Forecast-versus-Actual History</h3>
          <p className="text-xs text-slate-500 mb-4">Tracking monthly ANFIS prediction accuracy over time</p>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Period</th>
                  <th className="py-2.5 px-3">Forecasted Closing</th>
                  <th className="py-2.5 px-3">Actual Closing</th>
                  <th className="py-2.5 px-3 text-right">Variance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {data.forecast_comparison?.map((f: any, idx: number) => (
                  <tr key={idx}>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">{f.period}</td>
                    <td className="py-2.5 px-3">{formatINR(f.forecasted_closing)}</td>
                    <td className="py-2.5 px-3">
                      {f.actual_closing ? formatINR(f.actual_closing) : <span className="text-slate-400 italic">In progress</span>}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {f.error !== null ? (
                        <span className="text-emerald-600 font-bold">±{formatINR(f.error)}</span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Model Performance Reports */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
          <h3 className="font-semibold text-slate-900 text-sm mb-1">AI Engine Performance Benchmarks</h3>
          <p className="text-xs text-slate-500 mb-4">Empirical evaluation metrics across integrated modules</p>

          <div className="space-y-3">
            {data.model_performance?.map((m: any, idx: number) => (
              <div key={idx} className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-slate-900">{m.technique}</span>
                  <Badge variant="purple" size="sm">{m.status}</Badge>
                </div>
                <div className="flex justify-between text-slate-500 text-[11px] mt-1">
                  <span>Type: {m.type}</span>
                  <span className="font-semibold text-slate-800">{m.primary_metric}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
