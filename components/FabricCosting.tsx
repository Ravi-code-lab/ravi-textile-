import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FabricCosting, FabricCostingItem, Design
} from '../types';
import {
  Plus, Search, Edit2, Trash2, Copy, CheckCircle,
  BarChart3, TrendingUp, DollarSign, Package,
  ChevronDown, ChevronRight, X, Calculator,
  Layers, Percent, FileText, Archive, Download,
  AlertCircle, Info
} from 'lucide-react';
import BaseModal from './BaseModal';

interface FabricCostingProps {
  costings: FabricCosting[];
  designs: Design[];
  onAdd: (costing: FabricCosting) => void;
  onUpdate: (costing: FabricCosting) => void;
  onDelete: (id: string) => void;
  currency?: string;
}

const CATEGORIES = ['YARN', 'DYEING', 'WEAVING', 'FINISHING', 'PACKING', 'OVERHEAD', 'OTHER'] as const;

const categoryColors: Record<string, string> = {
  YARN:     'bg-violet-100 text-violet-800 border-violet-200',
  DYEING:   'bg-blue-100 text-blue-800 border-blue-200',
  WEAVING:  'bg-emerald-100 text-emerald-800 border-emerald-200',
  FINISHING:'bg-amber-100 text-amber-800 border-amber-200',
  PACKING:  'bg-pink-100 text-pink-800 border-pink-200',
  OVERHEAD: 'bg-slate-100 text-slate-700 border-slate-200',
  OTHER:    'bg-orange-100 text-orange-800 border-orange-200',
};

const statusColors: Record<string, string> = {
  DRAFT:    'bg-amber-50 text-amber-700 border border-amber-200',
  APPROVED: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  ARCHIVED: 'bg-slate-50 text-slate-500 border border-slate-200',
};

const emptyItem = (): FabricCostingItem => ({
  id: `CI-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  name: '',
  category: 'YARN',
  qty: 1,
  unit: 'kg',
  ratePerUnit: 0,
  wastagePercent: 0,
  amount: 0,
});

const emptyForm = (): Partial<FabricCosting> => ({
  name: '',
  fabricType: '',
  width: 110,
  overheadPercent: 10,
  profitPercent: 20,
  taxPercent: 5,
  items: [emptyItem()],
  status: 'DRAFT',
  currency: 'INR',
});

const calcItem = (item: FabricCostingItem): FabricCostingItem => {
  const effectiveQty = item.qty * (1 + (item.wastagePercent || 0) / 100);
  return { ...item, amount: effectiveQty * item.ratePerUnit };
};

const calcTotals = (items: FabricCostingItem[], overheadPercent: number, profitPercent: number, taxPercent: number) => {
  const rawMaterialCost = items.filter(i => i.category === 'YARN').reduce((s, i) => s + i.amount, 0);
  const processingCost  = items.filter(i => i.category !== 'YARN').reduce((s, i) => s + i.amount, 0);
  const subtotal = rawMaterialCost + processingCost;
  const overheadAmt = subtotal * overheadPercent / 100;
  const totalCost = subtotal + overheadAmt;
  const profit = totalCost * profitPercent / 100;
  const tax = (totalCost + profit) * taxPercent / 100;
  const sellingPrice = totalCost + profit + tax;
  const marginPercent = totalCost > 0 ? ((sellingPrice - totalCost) / sellingPrice) * 100 : 0;
  return { rawMaterialCost, processingCost, totalCost, sellingPrice, marginPercent };
};

const FabricCostingComp: React.FC<FabricCostingProps> = ({
  costings, designs, onAdd, onUpdate, onDelete, currency = '₹'
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<FabricCosting | null>(null);
  const [form, setForm] = useState<Partial<FabricCosting>>(emptyForm());
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'LIST' | 'ANALYTICS'>('LIST');

  /* ── derived ── */
  const filtered = useMemo(() =>
    costings.filter(c =>
      (statusFilter === 'ALL' || c.status === statusFilter) &&
      (!search ||
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.fabricType.toLowerCase().includes(search.toLowerCase()) ||
        c.designName?.toLowerCase().includes(search.toLowerCase()))
    ), [costings, search, statusFilter]);

  const stats = useMemo(() => {
    const approved = costings.filter(c => c.status === 'APPROVED');
    const avgMargin = approved.length
      ? approved.reduce((s, c) => s + c.marginPercent, 0) / approved.length : 0;
    const totalValue = approved.reduce((s, c) => s + c.sellingPrice, 0);
    return { total: costings.length, approved: approved.length, avgMargin, totalValue };
  }, [costings]);

  const categoryBreakdown = useMemo(() => {
    if (!form.items?.length) return [];
    const map: Record<string, number> = {};
    form.items.forEach(i => { map[i.category] = (map[i.category] || 0) + i.amount; });
    const total = Object.values(map).reduce((s, v) => s + v, 0);
    return Object.entries(map).map(([cat, amt]) => ({
      cat, amt, pct: total > 0 ? (amt / total) * 100 : 0
    })).sort((a, b) => b.amt - a.amt);
  }, [form.items]);

  /* ── live totals in form ── */
  const liveTotals = useMemo(() => {
    if (!form.items) return null;
    return calcTotals(form.items, form.overheadPercent || 0, form.profitPercent || 0, form.taxPercent || 0);
  }, [form.items, form.overheadPercent, form.profitPercent, form.taxPercent]);

  /* ── handlers ── */
  const openNew = () => {
    setEditing(null);
    setForm(emptyForm());
    setIsModalOpen(true);
  };

  const openEdit = (c: FabricCosting) => {
    setEditing(c);
    setForm({ ...c });
    setIsModalOpen(true);
  };

  const openDuplicate = (c: FabricCosting) => {
    setEditing(null);
    setForm({
      ...c,
      id: undefined,
      name: `${c.name} (Copy)`,
      status: 'DRAFT',
      createdAt: undefined,
    });
    setIsModalOpen(true);
  };

  const updateItem = useCallback((idx: number, patch: Partial<FabricCostingItem>) => {
    setForm(prev => {
      const items = [...(prev.items || [])];
      const updated = calcItem({ ...items[idx], ...patch });
      items[idx] = updated;
      const t = calcTotals(items, prev.overheadPercent || 0, prev.profitPercent || 0, prev.taxPercent || 0);
      return { ...prev, items, ...t };
    });
  }, []);

  const addItem = () => setForm(prev => ({ ...prev, items: [...(prev.items || []), emptyItem()] }));

  const removeItem = (idx: number) => setForm(prev => {
    const items = (prev.items || []).filter((_, i) => i !== idx);
    const t = calcTotals(items, prev.overheadPercent || 0, prev.profitPercent || 0, prev.taxPercent || 0);
    return { ...prev, items, ...t };
  });

  const updatePercent = (key: 'overheadPercent' | 'profitPercent' | 'taxPercent', val: number) => {
    setForm(prev => {
      const next = { ...prev, [key]: val };
      const t = calcTotals(next.items || [], next.overheadPercent || 0, next.profitPercent || 0, next.taxPercent || 0);
      return { ...next, ...t };
    });
  };

  const handleSave = () => {
    if (!form.name?.trim() || !form.fabricType?.trim()) return;
    const items = (form.items || []).map(calcItem);
    const t = calcTotals(items, form.overheadPercent || 0, form.profitPercent || 0, form.taxPercent || 0);
    const costing: FabricCosting = {
      id: editing?.id || `FC-${Date.now()}`,
      createdAt: editing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      name: form.name!,
      fabricType: form.fabricType!,
      width: form.width || 110,
      gsm: form.gsm,
      construction: form.construction,
      designId: form.designId,
      designName: form.designName,
      items,
      overheadPercent: form.overheadPercent || 0,
      profitPercent: form.profitPercent || 0,
      taxPercent: form.taxPercent || 0,
      status: form.status as FabricCosting['status'] || 'DRAFT',
      notes: form.notes,
      currency: form.currency || 'INR',
      version: (editing?.version || 0) + 1,
      ...t,
    };
    editing ? onUpdate(costing) : onAdd(costing);
    setIsModalOpen(false);
  };

  /* ── render ── */
  return (
    <div className="h-full flex flex-col gap-4 p-4 lg:p-6 overflow-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Calculator className="w-5 h-5 text-macos-accent" /> Fabric Costing
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">Build detailed cost sheets and set accurate selling prices</p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2 bg-macos-accent text-white rounded-xl text-sm font-semibold shadow hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" /> New Costing
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Sheets', value: stats.total, icon: FileText, color: 'text-indigo-600' },
          { label: 'Approved', value: stats.approved, icon: CheckCircle, color: 'text-emerald-600' },
          { label: 'Avg Margin', value: `${stats.avgMargin.toFixed(1)}%`, icon: Percent, color: 'text-amber-600' },
          { label: 'Total Selling Value', value: `${currency}${stats.totalValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, icon: TrendingUp, color: 'text-blue-600' },
        ].map(s => (
          <div key={s.label} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3">
            <div className="flex items-center gap-2 mb-1">
              <s.icon className={`w-4 h-4 ${s.color}`} />
              <span className="text-xs text-slate-500">{s.label}</span>
            </div>
            <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1 w-fit">
        {(['LIST', 'ANALYTICS'] as const).map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeTab === t ? 'bg-white dark:bg-slate-700 shadow text-slate-800 dark:text-slate-100' : 'text-slate-500'}`}>
            {t === 'LIST' ? 'Cost Sheets' : 'Analytics'}
          </button>
        ))}
      </div>

      {activeTab === 'LIST' && (
        <>
          {/* Filters */}
          <div className="flex gap-2 flex-wrap">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search fabric name, type…"
                className="w-full pl-8 pr-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-macos-accent/40" />
            </div>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              <option value="ALL">All Status</option>
              <option value="DRAFT">Draft</option>
              <option value="APPROVED">Approved</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>

          {/* List */}
          {filtered.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-16 text-center">
              <Calculator className="w-12 h-12 text-slate-300 mb-3" />
              <p className="text-sm text-slate-500">No cost sheets found</p>
              <button onClick={openNew} className="mt-3 text-xs text-macos-accent hover:underline">Create your first costing</button>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map(c => (
                <div key={c.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                  <div className="flex items-center gap-3 p-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                    onClick={() => setExpandedRow(expandedRow === c.id ? null : c.id)}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-slate-800 dark:text-slate-100 truncate">{c.name}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusColors[c.status]}`}>{c.status}</span>
                        {c.designName && <span className="text-xs text-slate-500 truncate">— {c.designName}</span>}
                      </div>
                      <div className="flex gap-3 mt-1 text-xs text-slate-500 flex-wrap">
                        <span>{c.fabricType}</span>
                        <span>{c.width}cm wide</span>
                        {c.gsm && <span>{c.gsm} GSM</span>}
                        {c.construction && <span>{c.construction}</span>}
                      </div>
                    </div>
                    <div className="hidden sm:flex gap-6 text-right shrink-0">
                      <div>
                        <p className="text-[10px] text-slate-400">Cost</p>
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{currency}{c.totalCost.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400">Selling</p>
                        <p className="text-sm font-bold text-emerald-600">{currency}{c.sellingPrice.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400">Margin</p>
                        <p className={`text-sm font-bold ${c.marginPercent >= 20 ? 'text-emerald-600' : c.marginPercent >= 10 ? 'text-amber-600' : 'text-red-500'}`}>
                          {c.marginPercent.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={e => { e.stopPropagation(); openEdit(c); }}
                        className="p-1.5 text-slate-400 hover:text-macos-accent hover:bg-macos-accent/10 rounded-lg transition-colors">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={e => { e.stopPropagation(); openDuplicate(c); }}
                        className="p-1.5 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors">
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={e => { e.stopPropagation(); onDelete(c.id); }}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${expandedRow === c.id ? 'rotate-90' : ''}`} />
                    </div>
                  </div>

                  <AnimatePresence initial={false}>
                    {expandedRow === c.id && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
                        <div className="px-4 pb-4 border-t border-slate-100 dark:border-slate-700 pt-3">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Items table */}
                            <div>
                              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Cost Breakdown</h4>
                              <div className="space-y-1">
                                {c.items.map(item => (
                                  <div key={item.id} className="flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-2">
                                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${categoryColors[item.category]}`}>{item.category}</span>
                                      <span className="text-slate-700 dark:text-slate-300">{item.name}</span>
                                    </div>
                                    <span className="font-semibold text-slate-700 dark:text-slate-300">{currency}{item.amount.toFixed(2)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                            {/* Summary */}
                            <div className="space-y-2">
                              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Price Summary</h4>
                              {[
                                ['Raw Material', currency + c.rawMaterialCost.toFixed(2)],
                                ['Processing', currency + c.processingCost.toFixed(2)],
                                ['Overhead (' + c.overheadPercent + '%)', currency + (c.totalCost - c.rawMaterialCost - c.processingCost).toFixed(2)],
                                ['Total Cost', currency + c.totalCost.toFixed(2)],
                                ['Selling Price', currency + c.sellingPrice.toFixed(2)],
                              ].map(([label, val], i) => (
                                <div key={label} className={`flex justify-between text-xs ${i === 3 ? 'font-bold text-slate-700 dark:text-slate-200 border-t border-slate-200 dark:border-slate-600 pt-1' : i === 4 ? 'font-bold text-emerald-600 text-sm' : 'text-slate-600 dark:text-slate-400'}`}>
                                  <span>{label}</span><span>{val}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                          {c.notes && <p className="mt-3 text-xs text-slate-500 italic">{c.notes}</p>}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === 'ANALYTICS' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Margin distribution */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-macos-accent" /> Margin Distribution
            </h3>
            <div className="space-y-2">
              {costings.filter(c => c.status === 'APPROVED').map(c => (
                <div key={c.id}>
                  <div className="flex justify-between text-xs mb-0.5">
                    <span className="text-slate-600 dark:text-slate-400 truncate max-w-[60%]">{c.name}</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{c.marginPercent.toFixed(1)}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${c.marginPercent >= 25 ? 'bg-emerald-500' : c.marginPercent >= 15 ? 'bg-amber-400' : 'bg-red-400'}`}
                      style={{ width: `${Math.min(c.marginPercent, 50) * 2}%` }} />
                  </div>
                </div>
              ))}
              {costings.filter(c => c.status === 'APPROVED').length === 0 && (
                <p className="text-xs text-slate-400 text-center py-4">No approved costings yet</p>
              )}
            </div>
          </div>
          {/* Category breakdown across all */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-500" /> Avg Cost Composition
            </h3>
            {(() => {
              const map: Record<string, number> = {};
              costings.forEach(c => c.items.forEach(i => { map[i.category] = (map[i.category] || 0) + i.amount; }));
              const total = Object.values(map).reduce((s, v) => s + v, 0);
              return Object.entries(map).sort(([, a], [, b]) => b - a).map(([cat, amt]) => (
                <div key={cat} className="mb-2">
                  <div className="flex justify-between text-xs mb-0.5">
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${categoryColors[cat]}`}>{cat}</span>
                    <span className="text-slate-600 dark:text-slate-400">{total > 0 ? ((amt / total) * 100).toFixed(1) : 0}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-macos-accent rounded-full" style={{ width: total > 0 ? `${(amt / total) * 100}%` : '0%' }} />
                  </div>
                </div>
              ));
            })()}
          </div>
        </div>
      )}

      {/* Modal */}
      <BaseModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}
        title={editing ? 'Edit Costing Sheet' : 'New Fabric Costing'}
        size="xl">
        <div className="space-y-5">
          {/* Header fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div className="sm:col-span-2 lg:col-span-2">
              <label className="block text-xs font-semibold text-slate-500 mb-1">Sheet Name *</label>
              <input value={form.name || ''} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                placeholder="e.g. Banarasi Saree Costing 2024"
                className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-macos-accent/40" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Status</label>
              <select value={form.status || 'DRAFT'} onChange={e => setForm(p => ({ ...p, status: e.target.value as any }))}
                className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800">
                <option value="DRAFT">Draft</option>
                <option value="APPROVED">Approved</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Fabric Type *</label>
              <input value={form.fabricType || ''} onChange={e => setForm(p => ({ ...p, fabricType: e.target.value }))}
                placeholder="e.g. Banarasi Silk, Cotton Cambric"
                className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-macos-accent/40" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Width (cm)</label>
              <input type="number" value={form.width || 110} onChange={e => setForm(p => ({ ...p, width: +e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-macos-accent/40" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">GSM</label>
              <input type="number" value={form.gsm || ''} onChange={e => setForm(p => ({ ...p, gsm: +e.target.value }))}
                placeholder="Optional"
                className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-macos-accent/40" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Construction</label>
              <input value={form.construction || ''} onChange={e => setForm(p => ({ ...p, construction: e.target.value }))}
                placeholder="e.g. 60x60 / 40x40"
                className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-macos-accent/40" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Linked Design</label>
              <select value={form.designId || ''} onChange={e => {
                const d = designs.find(d => d.id === e.target.value);
                setForm(p => ({ ...p, designId: e.target.value || undefined, designName: d?.name }));
              }} className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800">
                <option value="">None</option>
                {designs.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
          </div>

          {/* Items table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Cost Items</label>
              <button onClick={addItem} className="flex items-center gap-1 text-xs text-macos-accent hover:underline font-semibold">
                <Plus className="w-3 h-3" /> Add Item
              </button>
            </div>
            <div className="rounded-xl border border-slate-200 dark:border-slate-600 overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 dark:bg-slate-700">
                  <tr>
                    <th className="text-left px-3 py-2 text-slate-500 font-semibold">Item Name</th>
                    <th className="text-left px-2 py-2 text-slate-500 font-semibold w-24">Category</th>
                    <th className="text-right px-2 py-2 text-slate-500 font-semibold w-16">Qty</th>
                    <th className="text-left px-2 py-2 text-slate-500 font-semibold w-16">Unit</th>
                    <th className="text-right px-2 py-2 text-slate-500 font-semibold w-20">Rate</th>
                    <th className="text-right px-2 py-2 text-slate-500 font-semibold w-16">Waste%</th>
                    <th className="text-right px-2 py-2 text-slate-500 font-semibold w-20">Amount</th>
                    <th className="w-8" />
                  </tr>
                </thead>
                <tbody>
                  {(form.items || []).map((item, idx) => (
                    <tr key={item.id} className="border-t border-slate-100 dark:border-slate-700">
                      <td className="px-3 py-1.5">
                        <input value={item.name} onChange={e => updateItem(idx, { name: e.target.value })}
                          placeholder="e.g. Warp Yarn"
                          className="w-full bg-transparent focus:outline-none text-slate-700 dark:text-slate-300 placeholder-slate-300" />
                      </td>
                      <td className="px-2 py-1.5">
                        <select value={item.category} onChange={e => updateItem(idx, { category: e.target.value as any })}
                          className="w-full bg-transparent focus:outline-none text-slate-700 dark:text-slate-300 text-xs">
                          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </td>
                      <td className="px-2 py-1.5">
                        <input type="number" value={item.qty} onChange={e => updateItem(idx, { qty: +e.target.value })}
                          className="w-full bg-transparent focus:outline-none text-right text-slate-700 dark:text-slate-300" />
                      </td>
                      <td className="px-2 py-1.5">
                        <input value={item.unit} onChange={e => updateItem(idx, { unit: e.target.value })}
                          placeholder="kg"
                          className="w-full bg-transparent focus:outline-none text-slate-700 dark:text-slate-300" />
                      </td>
                      <td className="px-2 py-1.5">
                        <input type="number" value={item.ratePerUnit} onChange={e => updateItem(idx, { ratePerUnit: +e.target.value })}
                          className="w-full bg-transparent focus:outline-none text-right text-slate-700 dark:text-slate-300" />
                      </td>
                      <td className="px-2 py-1.5">
                        <input type="number" value={item.wastagePercent} onChange={e => updateItem(idx, { wastagePercent: +e.target.value })}
                          className="w-full bg-transparent focus:outline-none text-right text-slate-700 dark:text-slate-300" />
                      </td>
                      <td className="px-2 py-1.5 text-right font-semibold text-slate-700 dark:text-slate-300">
                        {currency}{item.amount.toFixed(2)}
                      </td>
                      <td className="px-1 py-1.5">
                        <button onClick={() => removeItem(idx)} className="p-1 text-slate-300 hover:text-red-500 transition-colors">
                          <X className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Percentages + Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-3">
              {([
                ['overheadPercent', 'Overhead %', 'slate'] as const,
                ['profitPercent', 'Profit Margin %', 'emerald'] as const,
                ['taxPercent', 'Tax %', 'amber'] as const,
              ]).map(([key, label]) => (
                <div key={key}>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">{label}</label>
                  <input type="number" value={(form as any)[key] || 0}
                    onChange={e => updatePercent(key, +e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-macos-accent/40" />
                </div>
              ))}
            </div>
            {liveTotals && (
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 space-y-2">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Price Summary</h4>
                {[
                  ['Raw Material', liveTotals.rawMaterialCost, 'text-slate-700'],
                  ['Processing', liveTotals.processingCost, 'text-slate-700'],
                  ['Total Cost', liveTotals.totalCost, 'text-slate-800 font-bold border-t border-slate-200 dark:border-slate-600 pt-1'],
                  ['Selling Price', liveTotals.sellingPrice, 'text-emerald-600 font-bold text-base'],
                ].map(([label, val, cls]) => (
                  <div key={label as string} className={`flex justify-between text-xs ${cls}`}>
                    <span>{label as string}</span>
                    <span>{currency}{(val as number).toFixed(2)}</span>
                  </div>
                ))}
                <div className="flex justify-between text-xs pt-1 border-t border-slate-200 dark:border-slate-600">
                  <span className="text-slate-500">Margin</span>
                  <span className={`font-bold ${liveTotals.marginPercent >= 20 ? 'text-emerald-600' : liveTotals.marginPercent >= 10 ? 'text-amber-500' : 'text-red-500'}`}>
                    {liveTotals.marginPercent.toFixed(1)}%
                  </span>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Notes</label>
            <textarea rows={2} value={form.notes || ''} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
              placeholder="Optional notes or assumptions…"
              className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-macos-accent/40 resize-none" />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
              Cancel
            </button>
            <button onClick={handleSave}
              disabled={!form.name?.trim() || !form.fabricType?.trim()}
              className="px-6 py-2 text-sm bg-macos-accent text-white rounded-lg font-semibold shadow hover:opacity-90 transition-opacity disabled:opacity-40">
              {editing ? 'Update' : 'Save'} Costing
            </button>
          </div>
        </div>
      </BaseModal>
    </div>
  );
};

export default FabricCostingComp;
