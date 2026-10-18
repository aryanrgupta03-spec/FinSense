import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  AlertTriangle,
  Brain,
  Layers,
  PieChart,
  Activity,
  CheckCircle2,
  TrendingUp,
  Info,
  ShieldAlert
} from 'lucide-react';
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  Tooltip,
  CartesianGrid,
  Cell
} from 'recharts';

import { api } from '../services/api';
import { formatINR, formatPercent, formatDate } from '../utils/formatters';
import { StatCard } from '../components/StatCard';
import { Badge } from '../components/Badge';

const CLUSTER_COLORS = ['#ec4899', '#3b82f6', '#10b981', '#8b5cf6'];

export const SpendingInsights: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'anomalies' | 'clusters'>('anomalies');
  const [anomaliesData, setAnomaliesData] = useState<any | null>(null);
  const [clustersData, setClustersData] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [anomRes, clustRes] = await Promise.all([
        api.getAnomalies(),
        api.getClusters()
      ]);
      setAnomaliesData(anomRes);
      setClustersData(clustRes);
    } catch (err) {
      console.error('Failed to load spending insights', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading || !anomaliesData || !clustersData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-500 font-medium">Evaluating supervised anomaly scores & competitive cluster centroids...</p>
      </div>
    );
  }

  const m = anomaliesData.evaluation_metrics;

  return (
    <div className="space-y-6">
      {/* 1. Header Navigation Toggle */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">Machine Learning Intelligence</h2>
          <p className="text-xs text-slate-500">
            Supervised anomaly scoring vs Unsupervised competitive clustering
          </p>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveTab('anomalies')}
            className={`px-4 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'anomalies'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
            <span>Supervised Anomaly Classifier</span>
          </button>

          <button
            onClick={() => setActiveTab('clusters')}
            className={`px-4 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'clusters'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Brain className="w-3.5 h-3.5 text-purple-500" />
            <span>Competitive Learning Clusters</span>
          </button>
        </div>
      </div>

      {/* VIEW A: Supervised Anomaly Detection */}
      {activeTab === 'anomalies' && (
        <div className="space-y-6">
          {/* Stat Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Flagged Anomalies"
              value={`${anomaliesData.anomalies_detected} records`}
              subtext={`Across ${anomaliesData.total_evaluated} total transactions`}
              icon={<ShieldAlert className="w-5 h-5 text-rose-600" />}
              badge={<Badge variant="danger">Rate: {anomaliesData.anomaly_rate_pct}%</Badge>}
            />

            <StatCard
              title="Model F1-Score"
              value={`${(m.f1_score * 100).toFixed(1)}%`}
              change={`Precision: ${(m.precision * 100).toFixed(1)}%`}
              changeType="positive"
              subtext={`Recall: ${(m.recall * 100).toFixed(1)}%`}
              icon={<Activity className="w-5 h-5 text-indigo-600" />}
            />

            <StatCard
              title="Overall Accuracy"
              value={`${(m.accuracy * 100).toFixed(1)}%`}
              subtext="Test validation split"
              icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
            />

            <StatCard
              title="Classifier Type"
              value="Multilayer Perceptron"
              subtext="Sigmoid non-linear output"
              badge={<Badge variant="purple">Supervised</Badge>}
            />
          </div>

          {/* Model Specification & Confusion Matrix */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
              <h3 className="font-semibold text-slate-900 text-sm mb-1">Supervised Neural Classifier Specification</h3>
              <p className="text-xs text-slate-500 mb-4">
                Trained on transaction vector deviations: amount Z-score, category frequency, day-of-month, and off-hours timing.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mb-4">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Precision</span>
                  <span className="font-bold text-slate-900 text-base">{(m.precision * 100).toFixed(1)}%</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Recall</span>
                  <span className="font-bold text-slate-900 text-base">{(m.recall * 100).toFixed(1)}%</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">F1-Score</span>
                  <span className="font-bold text-slate-900 text-base">{(m.f1_score * 100).toFixed(1)}%</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Accuracy</span>
                  <span className="font-bold text-slate-900 text-base">{(m.accuracy * 100).toFixed(1)}%</span>
                </div>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
                <span className="font-semibold block mb-0.5">Model Limitation Disclosure:</span>
                {m.limitations_note}
              </div>
            </div>

            {/* Confusion Matrix */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="font-semibold text-slate-900 text-sm mb-1">Confusion Matrix</h3>
                <p className="text-xs text-slate-500 mb-4">Evaluation on hold-out validation set</p>

                <div className="grid grid-cols-2 gap-2 text-center text-xs">
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                    <span className="text-[10px] text-emerald-700 block font-bold">True Positive (TP)</span>
                    <span className="text-xl font-bold text-emerald-900">{m.confusion_matrix.true_positive}</span>
                  </div>
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl">
                    <span className="text-[10px] text-rose-700 block font-bold">False Positive (FP)</span>
                    <span className="text-xl font-bold text-rose-900">{m.confusion_matrix.false_positive}</span>
                  </div>
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl">
                    <span className="text-[10px] text-rose-700 block font-bold">False Negative (FN)</span>
                    <span className="text-xl font-bold text-rose-900">{m.confusion_matrix.false_negative}</span>
                  </div>
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                    <span className="text-[10px] text-emerald-700 block font-bold">True Negative (TN)</span>
                    <span className="text-xl font-bold text-emerald-900">{m.confusion_matrix.true_negative}</span>
                  </div>
                </div>
              </div>
              <span className="text-[10px] text-slate-400 text-center block mt-3">Total Validation Samples: 453</span>
            </div>
          </div>

          {/* Anomalous Transactions Table */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
            <h3 className="font-semibold text-slate-900 text-base mb-1">Flagged Anomalous Transactions</h3>
            <p className="text-xs text-slate-500 mb-4">
              Transactions exceeding the 65.0% neural anomaly threshold with explanatory reasons
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 uppercase text-[10px]">
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Description & Merchant</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3 text-right">Amount</th>
                    <th className="py-2.5 px-3 text-center">Score</th>
                    <th className="py-2.5 px-3">Explanatory Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {anomaliesData.anomalous_transactions?.map((t: any) => (
                    <tr key={t.id} className="hover:bg-rose-50/30 transition-colors">
                      <td className="py-3 px-3 text-slate-500 whitespace-nowrap">{formatDate(t.date)}</td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-900">{t.description}</div>
                        <div className="text-[10px] text-slate-400">{t.merchant}</div>
                      </td>
                      <td className="py-3 px-3">{t.category}</td>
                      <td className="py-3 px-3 text-right font-bold text-slate-900 whitespace-nowrap">
                        {formatINR(t.amount)}
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <Badge variant="danger" size="sm">
                          {t.anomaly_score}% Anomaly
                        </Badge>
                      </td>
                      <td className="py-3 px-3 text-slate-600 text-xs">
                        {t.anomaly_reason}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW B: Unsupervised Competitive Learning Clusters */}
      {activeTab === 'clusters' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Learned Personas"
              value={`${clustersData.num_clusters} Clusters`}
              subtext="Unsupervised convergence"
              icon={<Brain className="w-5 h-5 text-purple-600" />}
            />

            <StatCard
              title="Quantization Error"
              value={clustersData.quantization_error.toString()}
              subtext="Average prototype distortion"
              icon={<Activity className="w-5 h-5 text-indigo-600" />}
            />

            <StatCard
              title="Learning Paradigm"
              value="Winner-Take-All"
              subtext="Kohonen competitive network"
              badge={<Badge variant="purple">Self-Organizing</Badge>}
            />

            <StatCard
              title="Clustering Target"
              value="Spending Personas"
              subtext="Discretionary vs essential ratios"
              icon={<Layers className="w-5 h-5 text-blue-600" />}
            />
          </div>

          {/* Cluster Profiles Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {clustersData.clusters?.map((c: any, idx: number) => (
              <div
                key={c.id}
                className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-sm text-slate-900 flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: CLUSTER_COLORS[idx % CLUSTER_COLORS.length] }}
                      />
                      {c.name}
                    </span>
                    <Badge variant="neutral" size="sm">
                      {c.size_percentage}% of cohort
                    </Badge>
                  </div>

                  <p className="text-xs text-slate-600 mb-3">{c.behavior_description}</p>

                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl mb-3 space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Representative Spend:</span>
                      <span className="font-bold text-slate-900">{formatINR(c.avg_monthly_spend)}/mo</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Primary Concentration:</span>
                      <span className="font-medium text-slate-800">{c.top_categories.join(', ')}</span>
                    </div>
                  </div>
                </div>

                {/* Centroid allocation breakdown */}
                {c.centroid_ratios && (
                  <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 grid grid-cols-4 gap-1 text-center">
                    <div>
                      <span className="block text-[10px] text-slate-400">Discretionary</span>
                      <span className="font-bold text-slate-800">{Math.round(c.centroid_ratios.discretionary * 100)}%</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-400">Essential</span>
                      <span className="font-bold text-slate-800">{Math.round(c.centroid_ratios.essential * 100)}%</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-400">Bills</span>
                      <span className="font-bold text-slate-800">{Math.round(c.centroid_ratios.bills * 100)}%</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-400">Savings</span>
                      <span className="font-bold text-emerald-600">{Math.round(c.centroid_ratios.savings * 100)}%</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* 2D Cluster Scatter Visualization */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
            <h3 className="font-semibold text-slate-900 text-base mb-1">Learned Cluster Projection Map</h3>
            <p className="text-xs text-slate-500 mb-4">
              2D projection of spending behavior vectors mapped to converged competitive neurons
            </p>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis type="number" dataKey="x" name="Discretionary Propensity" unit="%" tick={{ fontSize: 11 }} />
                  <YAxis type="number" dataKey="y" name="Fixed Commitments" unit="%" tick={{ fontSize: 11 }} />
                  <Tooltip
                    cursor={{ strokeDasharray: '3 3' }}
                    formatter={(val: any, name: any, item: any) => [
                      `${item.payload.label} (₹${item.payload.amount})`,
                      `Cluster #${item.payload.cluster_id}`
                    ]}
                  />
                  <Scatter data={clustersData.visualization_points}>
                    {clustersData.visualization_points.map((entry: any, index: number) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CLUSTER_COLORS[entry.cluster_id % CLUSTER_COLORS.length]}
                      />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
