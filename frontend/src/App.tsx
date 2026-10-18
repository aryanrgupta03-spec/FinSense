import React, { useState, useEffect } from 'react';
import { Sidebar, navigationItems } from './components/Sidebar';
import { TopBar } from './components/TopBar';

import { Overview } from './pages/Overview';
import { Transactions } from './pages/Transactions';
import { Budgets } from './pages/Budgets';
import { Goals } from './pages/Goals';
import { CashFlow } from './pages/CashFlow';
import { SpendingInsights } from './pages/SpendingInsights';
import { SavingsPlanner } from './pages/SavingsPlanner';
import { BillsSubscriptions } from './pages/BillsSubscriptions';
import { InvestmentReadiness } from './pages/InvestmentReadiness';
import { FinancialCopilot } from './pages/FinancialCopilot';
import { Reports } from './pages/Reports';
import { SettingsPage } from './pages/Settings';

import { api } from './services/api';

const PAGE_META: Record<string, { title: string; subtitle: string }> = {
  overview: {
    title: 'Financial Overview',
    subtitle: 'Consolidated dashboard derived from live multi-account ledger and AI models'
  },
  transactions: {
    title: 'Transactions & Ledger',
    subtitle: 'Transaction recording, statement CSV batch import, OCR intake, and neural anomaly checks'
  },
  budgets: {
    title: 'Budget Management',
    subtitle: 'Category limit tracking, daily velocity, burn rate pacing, and Prolog rule verification'
  },
  goals: {
    title: 'Financial Goals & Milestones',
    subtitle: 'Periodic contribution targets, deadline tracking, and feasibility projections'
  },
  cashflow: {
    title: 'Cash Flow Forecasting',
    subtitle: '5-Layer Adaptive Neuro-Fuzzy Inference System (ANFIS) month-end balance prediction'
  },
  insights: {
    title: 'Spending Insights & Machine Learning',
    subtitle: 'Supervised anomaly perceptron classification and unsupervised competitive SOM clustering'
  },
  'savings-planner': {
    title: 'Savings Planner & Search Optimization',
    subtitle: 'A* heuristic budget allocation search and financial dependency graph traversal'
  },
  bills: {
    title: 'Bills, Subscriptions & Decision Simulator',
    subtitle: 'Recurring obligation management with 3-round Minimax game-tree retention simulation'
  },
  investment: {
    title: 'Investment Readiness Assessment',
    subtitle: 'Dual Mamdani (linguistic classification) vs Sugeno (crisp surplus) Fuzzy Inference Systems'
  },
  copilot: {
    title: 'AI Financial Copilot',
    subtitle: 'Context-aware assistant with safe backend tool routing and zero numerical hallucination'
  },
  reports: {
    title: 'Reports & Statement Exports',
    subtitle: 'Monthly summaries, forecast adherence history, and PDF / CSV document generation'
  },
  settings: {
    title: 'Settings & System Diagnostics',
    subtitle: 'User profile, account configuration, AI system health, and demonstration baseline controls'
  }
};

export function App() {
  const [currentTab, setCurrentTab] = useState<string>('overview');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('2026-10');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [plannerState, setPlannerState] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);

  // Auto-login demo profile on initial load
  useEffect(() => {
    const initAuth = async () => {
      try {
        await api.autoLoginDemo();
        // Load initial notifications for TopBar
        const overview = await api.getOverview(selectedPeriod);
        if (overview.recommendations) {
          setNotifications(
            overview.recommendations.map((r: any) => ({
              id: r.id,
              title: r.title,
              message: r.rationale,
              notification_type: 'recommendation',
              source_technique: 'PEAS Agent',
              is_read: false
            }))
          );
        }
      } catch (err) {
        console.error('Initial auth setup error', err);
      }
    };
    initAuth();
  }, [selectedPeriod]);

  const handleSelectTab = (tab: string, state?: any) => {
    setCurrentTab(tab);
    if (state) {
      setPlannerState(state);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleResetDemo = async () => {
    await api.resetDemoData();
    window.location.reload();
  };

  const activeMeta = PAGE_META[currentTab] || {
    title: 'FinSense',
    subtitle: 'Autonomous AI-Powered Personal Finance Management System'
  };

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-900 flex">
      {/* 1. Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={handleSelectTab}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* 2. Main Content Container */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* TopBar */}
        <TopBar
          title={activeMeta.title}
          subtitle={activeMeta.subtitle}
          onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          selectedPeriod={selectedPeriod}
          onChangePeriod={setSelectedPeriod}
          onResetDemo={handleResetDemo}
          notifications={notifications}
        />

        {/* Page Content View */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {currentTab === 'overview' && (
            <Overview
              onNavigateTab={handleSelectTab}
              selectedPeriod={selectedPeriod}
            />
          )}

          {currentTab === 'transactions' && (
            <Transactions />
          )}

          {currentTab === 'budgets' && (
            <Budgets
              selectedPeriod={selectedPeriod}
            />
          )}

          {currentTab === 'goals' && (
            <Goals
              onNavigateTab={handleSelectTab}
            />
          )}

          {currentTab === 'cashflow' && (
            <CashFlow />
          )}

          {currentTab === 'insights' && (
            <SpendingInsights />
          )}

          {currentTab === 'savings-planner' && (
            <SavingsPlanner
              preselectedGoalId={plannerState?.preselectedGoalId}
            />
          )}

          {currentTab === 'bills' && (
            <BillsSubscriptions />
          )}

          {currentTab === 'investment' && (
            <InvestmentReadiness />
          )}

          {currentTab === 'copilot' && (
            <FinancialCopilot />
          )}

          {currentTab === 'reports' && (
            <Reports />
          )}

          {currentTab === 'settings' && (
            <SettingsPage />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
