import React, { useState, useEffect } from 'react';
import {
  Plus,
  Upload,
  Camera,
  Search,
  Filter,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Edit2,
  Check,
  FileSpreadsheet,
  CheckCircle2,
  Info
} from 'lucide-react';

import { api } from '../services/api';
import { formatINR, formatDate } from '../utils/formatters';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';

export const Transactions: React.FC = () => {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [categories, setCategories] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);

  // Filters & Pagination
  const [search, setSearch] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [anomalyOnly, setAnomalyOnly] = useState<boolean>(false);
  const [page, setPage] = useState<number>(0);
  const pageSize = 15;

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isCSVModalOpen, setIsCSVModalOpen] = useState<boolean>(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState<boolean>(false);
  const [editingTx, setEditingTx] = useState<any | null>(null);

  // Add form state
  const [formData, setFormData] = useState({
    account_id: 1,
    category_id: '',
    date: new Date().toISOString().split('T')[0],
    amount: '',
    transaction_type: 'expense',
    description: '',
    merchant: '',
    payment_method: 'UPI',
    notes: ''
  });

  // CSV Import State
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvAccountId, setCsvAccountId] = useState<number>(1);
  const [csvUploading, setCsvUploading] = useState<boolean>(false);
  const [csvSummary, setCsvSummary] = useState<any | null>(null);

  // Receipt Upload State
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptResult, setReceiptResult] = useState<any | null>(null);
  const [receiptUploading, setReceiptUploading] = useState<boolean>(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [txRes, catRes, profileRes] = await Promise.all([
        api.getTransactions({
          skip: page * pageSize,
          limit: pageSize,
          search: search || undefined,
          category_id: selectedCategory ? Number(selectedCategory) : undefined,
          transaction_type: selectedType || undefined,
          is_anomaly: anomalyOnly ? true : undefined
        }),
        api.getCategories(),
        api.getSettingsProfile()
      ]);

      setTransactions(txRes.transactions);
      setTotalCount(txRes.total);
      setCategories(catRes);
      setAccounts(profileRes.accounts || []);
      if (profileRes.accounts?.length > 0 && !formData.account_id) {
        setFormData(prev => ({ ...prev, account_id: profileRes.accounts[0].id }));
        setCsvAccountId(profileRes.accounts[0].id);
      }
    } catch (err) {
      console.error('Failed to load transactions', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, search, selectedCategory, selectedType, anomalyOnly]);

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        account_id: Number(formData.account_id),
        category_id: formData.category_id ? Number(formData.category_id) : undefined,
        amount: Number(formData.amount)
      };

      if (editingTx) {
        await api.updateTransaction(editingTx.id, payload);
      } else {
        await api.createTransaction(payload);
      }

      setIsAddModalOpen(false);
      setEditingTx(null);
      setFormData({
        account_id: accounts[0]?.id || 1,
        category_id: '',
        date: new Date().toISOString().split('T')[0],
        amount: '',
        transaction_type: 'expense',
        description: '',
        merchant: '',
        payment_method: 'UPI',
        notes: ''
      });
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Error saving transaction');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this ledger entry?')) return;
    try {
      await api.deleteTransaction(id);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Error deleting transaction');
    }
  };

  const handleCategoryCorrection = async (txId: number, newCatId: number) => {
    try {
      await api.updateTransaction(txId, {
        category_id: newCatId,
        user_corrected_category: true
      });
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Error updating category');
    }
  };

  const handleCSVUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvFile) return;
    setCsvUploading(true);
    try {
      const form = new FormData();
      form.append('file', csvFile);
      form.append('account_id', String(csvAccountId));

      const res = await api.importCSV(form);
      setCsvSummary(res);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Error importing CSV');
    } finally {
      setCsvUploading(false);
    }
  };

  const handleReceiptUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiptFile) return;
    setReceiptUploading(true);
    try {
      const form = new FormData();
      form.append('file', receiptFile);
      form.append('account_id', String(accounts[0]?.id || 1));

      const res = await api.uploadReceipt(form);
      setReceiptResult(res);
    } catch (err: any) {
      alert(err.message || 'Error parsing receipt');
    } finally {
      setReceiptUploading(false);
    }
  };

  const handleApplyReceiptToForm = () => {
    if (!receiptResult) return;
    setFormData({
      account_id: accounts[0]?.id || 1,
      category_id: '',
      date: receiptResult.date,
      amount: String(receiptResult.total_amount),
      transaction_type: 'expense',
      description: `Receipt: ${receiptResult.merchant}`,
      merchant: receiptResult.merchant,
      payment_method: 'UPI',
      notes: receiptResult.note
    });
    setIsReceiptModalOpen(false);
    setIsAddModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Action Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          {/* Search Input */}
          <div className="relative min-w-[200px] flex-1 sm:flex-initial">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              placeholder="Search merchants, description..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => { setSelectedCategory(e.target.value); setPage(0); }}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          {/* Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => { setSelectedType(e.target.value); setPage(0); }}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="">All Types</option>
            <option value="expense">Expenses Only</option>
            <option value="income">Income Only</option>
          </select>

          {/* Anomaly Only Filter */}
          <button
            onClick={() => { setAnomalyOnly(!anomalyOnly); setPage(0); }}
            className={`px-3 py-1.5 text-xs rounded-xl border transition-colors flex items-center gap-1.5 font-medium ${
              anomalyOnly
                ? 'bg-rose-50 text-rose-700 border-rose-200'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <AlertTriangle className={`w-3.5 h-3.5 ${anomalyOnly ? 'text-rose-600' : 'text-slate-400'}`} />
            <span>Anomalies Only</span>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={() => { setCsvSummary(null); setCsvFile(null); setIsCSVModalOpen(true); }}
            className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5 text-slate-500" />
            <span>Import CSV</span>
          </button>

          <button
            onClick={() => { setReceiptResult(null); setReceiptFile(null); setIsReceiptModalOpen(true); }}
            className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
          >
            <Camera className="w-3.5 h-3.5 text-slate-500" />
            <span>Intake Receipt</span>
          </button>

          <button
            onClick={() => {
              setEditingTx(null);
              setFormData({
                account_id: accounts[0]?.id || 1,
                category_id: '',
                date: new Date().toISOString().split('T')[0],
                amount: '',
                transaction_type: 'expense',
                description: '',
                merchant: '',
                payment_method: 'UPI',
                notes: ''
              });
              setIsAddModalOpen(true);
            }}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add Transaction</span>
          </button>
        </div>
      </div>

      {/* Transactions Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100 text-slate-400 uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Description & Merchant</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Account / Mode</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4 text-center">Neural Anomaly Check</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Filtering financial records...
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No transactions matched your active filters.
                  </td>
                </tr>
              ) : (
                transactions.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/60 transition-colors group">
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">{formatDate(t.date)}</td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{t.description}</div>
                      {t.merchant && (
                        <div className="text-[10px] text-slate-400 flex items-center gap-1">
                          <span>{t.merchant}</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {/* Interactive inline category selector to support feedback training */}
                      <select
                        value={t.category_id || ''}
                        onChange={(e) => handleCategoryCorrection(t.id, Number(e.target.value))}
                        className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-800 font-medium focus:outline-none cursor-pointer hover:border-slate-300"
                        title="Click to correct category (trains classifier feedback loop)"
                      >
                        <option value="">Uncategorized</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                      {t.user_corrected_category && (
                        <span className="block text-[9px] text-blue-600 font-medium mt-0.5">
                          ✓ User Verified
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="text-slate-800 font-medium">{t.account?.name || 'Primary'}</div>
                      <div className="text-[10px] text-slate-400">{t.payment_method}</div>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <span className={`font-bold text-sm ${t.transaction_type === 'income' ? 'text-emerald-600' : 'text-slate-900'}`}>
                        {t.transaction_type === 'income' ? '+' : '-'}{formatINR(t.amount)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      {t.is_anomaly ? (
                        <div className="inline-flex flex-col items-center group relative cursor-help">
                          <Badge variant="danger" size="sm">
                            Score: {t.anomaly_score}%
                          </Badge>
                          {t.anomaly_reason && (
                            <span className="text-[9px] text-rose-600 max-w-[140px] truncate mt-0.5">
                              {t.anomaly_reason}
                            </span>
                          )}
                        </div>
                      ) : (
                        <Badge variant="neutral" size="sm">
                          Normal ({t.anomaly_score}%)
                        </Badge>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100">
                        <button
                          onClick={() => {
                            setEditingTx(t);
                            setFormData({
                              account_id: t.account_id,
                              category_id: t.category_id || '',
                              date: t.date,
                              amount: String(t.amount),
                              transaction_type: t.transaction_type,
                              description: t.description,
                              merchant: t.merchant || '',
                              payment_method: t.payment_method,
                              notes: t.notes || ''
                            });
                            setIsAddModalOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Edit transaction"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(t.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete transaction"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-100 bg-slate-50/50 text-xs text-slate-500">
          <div>
            Showing <span className="font-semibold text-slate-900">{totalCount > 0 ? page * pageSize + 1 : 0}</span> to{' '}
            <span className="font-semibold text-slate-900">{Math.min(totalCount, (page + 1) * pageSize)}</span> of{' '}
            <span className="font-semibold text-slate-900">{totalCount}</span> records
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-medium">Page {page + 1}</span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={(page + 1) * pageSize >= totalCount}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* MODAL 1: Create or Edit Transaction */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={editingTx ? 'Edit Transaction' : 'Record Transaction'}
        description="Enter transaction details with automated categorization and anomaly evaluation"
      >
        <form onSubmit={handleCreateOrUpdate} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Type</label>
              <select
                value={formData.transaction_type}
                onChange={(e) => setFormData({ ...formData, transaction_type: e.target.value })}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="expense">Expense (Debit)</option>
                <option value="income">Income (Credit)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Amount (INR ₹)</label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="₹0.00"
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description / Particulars</label>
            <input
              type="text"
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="e.g. Swiggy Gourmet Lunch"
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Merchant (Optional)</label>
              <input
                type="text"
                value={formData.merchant}
                onChange={(e) => setFormData({ ...formData, merchant: e.target.value })}
                placeholder="e.g. Swiggy India"
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Date</label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
              <select
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="">Auto-Detect via Merchant Rules</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Account</label>
              <select
                value={formData.account_id}
                onChange={(e) => setFormData({ ...formData, account_id: Number(e.target.value) })}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>{a.name} ({formatINR(a.balance)})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors shadow-xs"
            >
              {editingTx ? 'Update Record' : 'Record Transaction'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: CSV Import Modal */}
      <Modal
        isOpen={isCSVModalOpen}
        onClose={() => setIsCSVModalOpen(false)}
        title="Import Bank Statement (CSV)"
        description="Upload bank CSV statements with automatic column mapping, deduplication, and anomaly classification."
      >
        {!csvSummary ? (
          <form onSubmit={handleCSVUpload} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Target Account</label>
              <select
                value={csvAccountId}
                onChange={(e) => setCsvAccountId(Number(e.target.value))}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>{a.name} ({a.account_type})</option>
                ))}
              </select>
            </div>

            <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center hover:border-blue-400 transition-colors">
              <FileSpreadsheet className="w-10 h-10 text-slate-400 mx-auto mb-2" />
              <p className="text-xs font-medium text-slate-700 mb-1">
                {csvFile ? csvFile.name : 'Choose a CSV bank statement or export'}
              </p>
              <p className="text-[11px] text-slate-400 mb-3">Supports standard columns: Date, Description, Amount, Type</p>
              <input
                type="file"
                accept=".csv"
                onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                className="text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsCSVModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!csvFile || csvUploading}
                className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl disabled:opacity-50 transition-colors"
              >
                {csvUploading ? 'Validating & Importing...' : 'Upload & Process'}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
              <div className="flex items-center gap-2 text-emerald-800 font-semibold text-sm mb-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Import Completed Successfully</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs mt-3 text-emerald-900">
                <div>Processed: <span className="font-bold">{csvSummary.total_processed}</span></div>
                <div>Imported: <span className="font-bold">{csvSummary.imported_count}</span></div>
                <div>Duplicates: <span className="font-bold">{csvSummary.duplicate_count}</span></div>
                <div>Anomalies: <span className="font-bold text-rose-700">{csvSummary.anomalies_detected}</span></div>
              </div>
            </div>

            <button
              onClick={() => setIsCSVModalOpen(false)}
              className="w-full py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition-colors"
            >
              Done
            </button>
          </div>
        )}
      </Modal>

      {/* MODAL 3: Receipt OCR Intake */}
      <Modal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        title="Intake Expense Receipt"
        description="Upload receipt images or slips for automatic OCR field extraction."
      >
        {!receiptResult ? (
          <form onSubmit={handleReceiptUpload} className="space-y-4">
            <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center hover:border-blue-400 transition-colors">
              <Camera className="w-10 h-10 text-slate-400 mx-auto mb-2" />
              <p className="text-xs font-medium text-slate-700 mb-1">
                {receiptFile ? receiptFile.name : 'Select receipt snapshot or slip'}
              </p>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                className="text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsReceiptModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!receiptFile || receiptUploading}
                className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl disabled:opacity-50"
              >
                {receiptUploading ? 'Extracting via OCR...' : 'Run OCR Extraction'}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
              <div className="flex justify-between font-semibold text-slate-900 border-b border-slate-200 pb-2">
                <span>OCR Extracted Fields</span>
                <span className="text-emerald-600">{Math.round(receiptResult.confidence * 100)}% Confidence</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-slate-600 pt-1">
                <div>Merchant: <span className="font-bold text-slate-900">{receiptResult.merchant}</span></div>
                <div>Amount: <span className="font-bold text-slate-900">{formatINR(receiptResult.total_amount)}</span></div>
                <div>Date: <span className="font-bold text-slate-900">{receiptResult.date}</span></div>
                <div>Category: <span className="font-bold text-slate-900">{receiptResult.detected_category}</span></div>
              </div>
              <p className="text-[11px] text-slate-400 italic pt-1">{receiptResult.note}</p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setReceiptResult(null)}
                className="flex-1 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-200"
              >
                Re-upload
              </button>
              <button
                type="button"
                onClick={handleApplyReceiptToForm}
                className="flex-1 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700"
              >
                Populate Entry Form
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
