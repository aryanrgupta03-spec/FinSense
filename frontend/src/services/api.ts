/**
 * FinSense API Service
 * Handles communication with FastAPI backend endpoints with bearer token auth.
 */

const API_BASE = '/api/v1';

class ApiService {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('finsense_token');
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('finsense_token', token);
  }

  getToken(): string | null {
    return this.token;
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('finsense_token');
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (!res.ok) {
      if (res.status === 401 && !endpoint.includes('/auth/login')) {
        // If unauthorized, attempt auto-login demo account
        await this.autoLoginDemo();
        // Retry once
        headers['Authorization'] = `Bearer ${this.token}`;
        const retryRes = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
        if (retryRes.ok) {
          return retryRes.json();
        }
      }
      const err = await res.json().catch(() => ({ detail: 'Network error' }));
      throw new Error(err.detail || `Request failed with status ${res.status}`);
    }

    return res.json();
  }

  async autoLoginDemo() {
    try {
      const res = await fetch(`${API_BASE}/auth/login/json`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'demo@finsense.ai', password: 'finsense123' })
      });
      if (res.ok) {
        const data = await res.json();
        this.setToken(data.access_token);
        return data.user;
      }
    } catch (e) {
      console.error('Auto login failed', e);
    }
    return null;
  }

  // Auth
  async login(email: string, pass: string) {
    const data = await this.request<any>('/auth/login/json', {
      method: 'POST',
      body: JSON.stringify({ email, password: pass })
    });
    this.setToken(data.access_token);
    return data;
  }

  async getMe() {
    return this.request<any>('/auth/me');
  }

  // Overview
  async getOverview(period?: string) {
    const q = period ? `?period=${encodeURIComponent(period)}` : '';
    return this.request<any>(`/overview${q}`);
  }

  // Transactions
  async getTransactions(params: Record<string, any> = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        query.append(k, String(v));
      }
    });
    return this.request<any>(`/transactions?${query.toString()}`);
  }

  async createTransaction(data: any) {
    return this.request<any>('/transactions', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateTransaction(id: number, data: any) {
    return this.request<any>(`/transactions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async deleteTransaction(id: number) {
    return this.request<any>(`/transactions/${id}`, {
      method: 'DELETE'
    });
  }

  async importCSV(formData: FormData) {
    return this.request<any>('/transactions/import-csv', {
      method: 'POST',
      body: formData
    });
  }

  async uploadReceipt(formData: FormData) {
    return this.request<any>('/transactions/upload-receipt', {
      method: 'POST',
      body: formData
    });
  }

  // Budgets
  async getBudgets(period?: string) {
    const q = period ? `?period=${encodeURIComponent(period)}` : '';
    return this.request<any>(`/budgets${q}`);
  }

  async createBudget(data: any) {
    return this.request<any>('/budgets', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateBudget(id: number, data: any) {
    return this.request<any>(`/budgets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async deleteBudget(id: number) {
    return this.request<any>(`/budgets/${id}`, {
      method: 'DELETE'
    });
  }

  async getCategories() {
    return this.request<any[]>('/budgets/categories');
  }

  // Goals
  async getGoals() {
    return this.request<any[]>('/goals');
  }

  async createGoal(data: any) {
    return this.request<any>('/goals', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateGoal(id: number, data: any) {
    return this.request<any>(`/goals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async deleteGoal(id: number) {
    return this.request<any>(`/goals/${id}`, {
      method: 'DELETE'
    });
  }

  async contributeToGoal(id: number, amount: number, accountId: number) {
    return this.request<any>(`/goals/${id}/contribute?amount=${amount}&account_id=${accountId}`, {
      method: 'POST'
    });
  }

  // Cash Flow
  async getCashflow() {
    return this.request<any>('/cashflow');
  }

  // Insights
  async getAnomalies() {
    return this.request<any>('/insights/anomalies');
  }

  async getClusters() {
    return this.request<any>('/insights/clusters');
  }

  // Savings Planner (A* Search & Dependency Graph)
  async optimizeSavingsPlan(data: any) {
    return this.request<any>('/savings-planner/optimize', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async getDependencyGraph() {
    return this.request<any>('/savings-planner/dependency-graph');
  }

  async simulateDependencyImpact(data: any) {
    return this.request<any>('/savings-planner/dependency-graph/simulate-impact', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // Bills & Minimax Simulator
  async getBills() {
    return this.request<any[]>('/bills');
  }

  async createBill(data: any) {
    return this.request<any>('/bills', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateBill(id: number, data: any) {
    return this.request<any>(`/bills/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async deleteBill(id: number) {
    return this.request<any>(`/bills/${id}`, {
      method: 'DELETE'
    });
  }

  async simulateMinimax(billId: number, depth: number = 3) {
    return this.request<any>(`/bills/${billId}/simulate-minimax?search_depth=${depth}`, {
      method: 'POST'
    });
  }

  // Investment Readiness (Mamdani vs Sugeno)
  async getInvestmentReadiness(params: Record<string, any> = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        query.append(k, String(v));
      }
    });
    return this.request<any>(`/investment?${query.toString()}`);
  }

  // Copilot Chat
  async chatCopilot(message: string, conversationId?: number) {
    return this.request<any>('/copilot/chat', {
      method: 'POST',
      body: JSON.stringify({ message, conversation_id: conversationId })
    });
  }

  async getConversations() {
    return this.request<any[]>('/copilot/conversations');
  }

  async getConversation(id: number) {
    return this.request<any>(`/copilot/conversations/${id}`);
  }

  // Reports
  async getReportsSummary() {
    return this.request<any>('/reports/summary');
  }

  getExportCSVUrl() {
    return `${API_BASE}/reports/export/csv`;
  }

  getExportPDFUrl() {
    return `${API_BASE}/reports/export/pdf`;
  }

  // Settings
  async getSettingsProfile() {
    return this.request<any>('/settings/profile');
  }

  async updateSettingsProfile(data: any) {
    return this.request<any>('/settings/profile', {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async resetDemoData() {
    return this.request<any>('/settings/reset-demo', {
      method: 'POST'
    });
  }

  async getSystemDiagnostics() {
    return this.request<any>('/settings/system-diagnostics');
  }
}

export const api = new ApiService();
