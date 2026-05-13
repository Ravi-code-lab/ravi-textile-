import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { YarnLot, YarnBlend } from '../types';
import {
  Plus, Search, Edit2, Trash2, Filter, DownloadCloud,
  BarChart3, TrendingUp, AlertTriangle, CheckCircle,
  Package, Layers, ArrowRight, Activity, Zap, RefreshCcw,
  ChevronRight, MoreVertical, Info, Archive
} from 'lucide-react';
import BaseModal from './BaseModal';

interface YarnManagementProps {
  lots: YarnLot[];
  blends: YarnBlend[];
  onAddLot: (lot: YarnLot) => void;
  onUpdateLot: (lot: YarnLot) => void;
  onDeleteLot: (id: string) => void;
  onAddBlend: (blend: YarnBlend) => void;
  onUpdateBlend: (blend: YarnBlend) => void;
  currency?: string;
}

const YARN_TYPES = ['COTTON', 'POLYESTER', 'SILK', 'WOOL', 'VISCOSE', 'LINEN', 'NYLON', 'ACRYLIC', 'BLENDED'];
const YARN_COUNTS = ['20s', '30s', '40s', '60s', '80s', '100s', '2/20s', '2/30s', '2/40s', 'Custom'];
const TWIST_DIRS = ['S-Twist', 'Z-Twist'];

const statusColor: Record<string, string> = {
  AVAILABLE: 'text-emerald-600 bg-emerald-50 border-emerald-200',
  ISSUED: 'text-blue-600 bg-blue-50 border-blue-200',
  CONSUMED: 'text-slate-500 bg-slate-50 border-slate-200',
  REJECTED: 'text-red-600 bg-red-50 border-red-200',
  HOLD: 'text-amber-600 bg-amber-50 border-amber-200',
};

const YarnManagement: React.FC<YarnManagementProps> = ({
  lots, blends, onAddLot, onUpdateLot, onDeleteLot, onAddBlend, onUpdateBlend, currency = '₹'
}) => {
  const [activeTab, setActiveTab] = useState<'LOTS' | 'BLENDS' | 'ANALYTICS'>('LOTS');
  const [filter, setFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [isLotModalOpen, setIsLotModalOpen] = useState(false);
  const [isBlendModalOpen, setIsBlendModalOpen] = useState(false);
  const [selectedLot, setSelectedLot] = useState<YarnLot | null>(null);
  const [selectedBlend, setSelectedBlend] = useState<YarnBlend | null>(null);

  const [lotForm, setLotForm] = useState<Partial<YarnLot>>({
    type: 'COTTON', count: '30s', twist: 'S-Twist', status: 'AVAILABLE',
    receivedQty: 0, currentQty: 0, pricePerKg: 0,
    receivedDate: new Date().toISOString().split('T')[0]
  });

  const [blendForm, setBlendForm] = useState<Partial<YarnBlend>>({
    name: '', components: [], status: 'ACTIVE'
  });

  const filteredLots = useMemo(() =>
    lots.filter(l =>
      (typeFilter === 'ALL' || l.type === typeFilter) &&
      (l.lotNumber?.toLowerCase().includes(filter.toLowerCase()) ||
        l.type?.toLowerCase().includes(filter.toLowerCase()) ||
        l.supplierName?.toLowerCase().includes(filter.toLowerCase()))
    ), [lots, filter, typeFilter]);

  const stats = useMemo(() => {
    const totalKg = lots.reduce((s, l) => s + (l.currentQty || 0), 0);
    const totalValue = lots.reduce((s, l) => s + ((l.currentQty || 0) * (l.pricePerKg || 0)), 0);
    const available = lots.filter(l => l.status === 'AVAILABLE').length;
    const lowStock = lots.filter(l => (l.currentQty || 0) < 50).length;
    return { totalKg, totalValue, available, lowStock };
  }, [lots]);

  const byType = useMemo(() => {
    const map: Record<string, number> = {};
    lots.forEach(l => { map[l.type] = (map[l.type] || 0) + (l.currentQty || 0); });
    return Object.entries(map).map(([type, kg]) => ({ type, kg })).sort((a, b) => b.kg - a.kg);
  }, [lots]);

  const handleSaveLot = () => {
    const lot: YarnLot = {
      ...lotForm,
      id: lotForm.id || `YRN-${Date.now().toString().slice(-6)}`,
      updatedAt: new Date().toISOString(),
      currentQty: lotForm.currentQty ?? lotForm.receivedQty ?? 0
    } as YarnLot;
    if (lotForm.id) onUpdateLot(lot); else onAddLot(lot);
    setIsLotModalOpen(false);
    setSelectedLot(null);
    setLotForm({ type: 'COTTON', count: '30s', twist: 'S-Twist', status: 'AVAILABLE', receivedQty: 0, currentQty: 0, pricePerKg: 0, receivedDate: new Date().toISOString().split('T')[0] });
  };

  const openEdit = (lot: YarnLot) => { setSelectedLot(lot); setLotForm(lot); setIsLotModalOpen(true); };

  const utilization = (lot: YarnLot) => lot.receivedQty > 0 ? Math.round(((lot.receivedQty - lot.currentQty) / lot.receivedQty) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Stock', value: `${stats.totalKg.toFixed(0)} kg`, icon: Package, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Stock Value', value: `${currency}${stats.totalValue.toLocaleString()}`, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Available Lots', value: stats.available, icon: CheckCircle, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Low Stock Lots', value: stats.lowStock, icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50' },
        ].map(s => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700 shadow-sm">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center`}>
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <div>
                <p className="text-xs text-slate-500">{s.label}</p>
                <p className="text-lg font-bold text-slate-800 dark:text-white">{s.value}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          {(['LOTS', 'BLENDS', 'ANALYTICS'] as const).map(t => (
            <button key={t} onClick={() => setActiveTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === t ? 'bg-white dark:bg-slate-700 shadow text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}>
              {t === 'LOTS' ? 'Yarn Lots' : t === 'BLENDS' ? 'Blends' : 'Analytics'}
            </button>
          ))}
        </div>
        <button onClick={() => setIsLotModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-all shadow-sm">
          <Plus className="w-4 h-4" /> Add Yarn Lot
        </button>
      </div>

      {/* LOTS TAB */}
      {activeTab === 'LOTS' && (
        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input value={filter} onChange={e => setFilter(e.target.value)} placeholder="Search lot number, type, supplier..."
                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-300 outline-none" />
            </div>
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
              className="px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm">
              <option value="ALL">All Types</option>
              {YARN_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {filteredLots.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No yarn lots found</p>
              <p className="text-sm mt-1">Add your first yarn lot to get started</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {filteredLots.map(lot => (
                <motion.div key={lot.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                        <span className="text-xs font-bold text-indigo-600">{lot.count || '?'}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800 dark:text-white">{lot.lotNumber}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${statusColor[lot.status] || 'text-slate-500 bg-slate-50'}`}>
                            {lot.status}
                          </span>
                        </div>
                        <p className="text-sm text-slate-500">{lot.type} · {lot.count} · {lot.twist} {lot.shade ? `· Shade: ${lot.shade}` : ''}</p>
                        {lot.supplierName && <p className="text-xs text-slate-400 mt-0.5">Supplier: {lot.supplierName}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right hidden sm:block">
                        <p className="text-xs text-slate-400">Current / Received</p>
                        <p className="font-bold text-slate-800 dark:text-white">{lot.currentQty} <span className="text-slate-400 font-normal">/ {lot.receivedQty} kg</span></p>
                        <div className="w-24 h-1.5 bg-slate-100 rounded-full mt-1">
                          <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${utilization(lot)}%` }} />
                        </div>
                      </div>
                      <div className="text-right hidden md:block">
                        <p className="text-xs text-slate-400">Rate</p>
                        <p className="font-bold text-slate-800 dark:text-white">{currency}{lot.pricePerKg}/kg</p>
                        <p className="text-xs text-slate-400">Value: {currency}{((lot.currentQty || 0) * (lot.pricePerKg || 0)).toLocaleString()}</p>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(lot)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-indigo-600 transition-all">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => onDeleteLot(lot.id)} className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-all">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                  {/* Progress bar for mobile */}
                  <div className="mt-3 sm:hidden">
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                      <span>{lot.currentQty} kg remaining</span><span>{utilization(lot)}% used</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full">
                      <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${utilization(lot)}%` }} />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* BLENDS TAB */}
      {activeTab === 'BLENDS' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-slate-500">{blends.length} blend recipes</p>
            <button onClick={() => setIsBlendModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-medium hover:bg-purple-700 transition-all">
              <Plus className="w-4 h-4" /> New Blend
            </button>
          </div>
          {blends.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <Layers className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No blend recipes</p>
              <p className="text-sm mt-1">Create blend recipes for your designs</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {blends.map(blend => (
                <div key={blend.id} className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-slate-800 dark:text-white">{blend.name}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full ${blend.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-500'}`}>
                      {blend.status}
                    </span>
                  </div>
                  {blend.description && <p className="text-sm text-slate-500 mb-3">{blend.description}</p>}
                  <div className="space-y-2">
                    {blend.components.map((c, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-indigo-400 to-purple-500 rounded-full" style={{ width: `${c.percentage}%` }} />
                        </div>
                        <span className="text-xs text-slate-600 w-32 truncate">{c.yarnType}</span>
                        <span className="text-xs font-bold text-indigo-600 w-10 text-right">{c.percentage}%</span>
                      </div>
                    ))}
                  </div>
                  {blend.targetCount && (
                    <p className="text-xs text-slate-400 mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                      Target Count: {blend.targetCount} · Twist: {blend.twist || 'N/A'}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ANALYTICS TAB */}
      {activeTab === 'ANALYTICS' && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm">
            <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-500" /> Stock by Yarn Type
            </h3>
            {byType.map(({ type, kg }) => {
              const max = byType[0]?.kg || 1;
              return (
                <div key={type} className="mb-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-600 dark:text-slate-300 font-medium">{type}</span>
                    <span className="text-slate-500">{kg.toFixed(1)} kg</span>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full">
                    <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-700" style={{ width: `${(kg / max) * 100}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm">
            <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-500" /> Lot Status Summary
            </h3>
            <div className="space-y-3">
              {(['AVAILABLE', 'ISSUED', 'CONSUMED', 'REJECTED', 'HOLD'] as const).map(status => {
                const count = lots.filter(l => l.status === status).length;
                return (
                  <div key={status} className="flex items-center justify-between">
                    <span className={`text-sm px-3 py-1 rounded-full border font-medium ${statusColor[status]}`}>{status}</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">{count} lot{count !== 1 ? 's' : ''}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="md:col-span-2 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-slate-800 dark:to-slate-800 rounded-2xl p-6 border border-indigo-100 dark:border-slate-700">
            <h3 className="font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" /> Low Stock Alerts
            </h3>
            {lots.filter(l => l.currentQty < 50 && l.status === 'AVAILABLE').length === 0 ? (
              <div className="flex items-center gap-2 text-emerald-600">
                <CheckCircle className="w-5 h-5" />
                <span className="text-sm font-medium">All yarn lots have adequate stock</span>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-3">
                {lots.filter(l => l.currentQty < 50 && l.status === 'AVAILABLE').map(lot => (
                  <div key={lot.id} className="bg-white dark:bg-slate-700 rounded-xl p-3 border border-amber-200 dark:border-amber-800 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-800 dark:text-white text-sm">{lot.lotNumber}</p>
                      <p className="text-xs text-slate-500">{lot.type} · {lot.count}</p>
                    </div>
                    <span className="text-amber-600 font-bold text-sm">{lot.currentQty} kg</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add/Edit Lot Modal */}
      <BaseModal isOpen={isLotModalOpen} onClose={() => { setIsLotModalOpen(false); setSelectedLot(null); }} title={selectedLot ? 'Edit Yarn Lot' : 'Add Yarn Lot'}>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Lot Number *</label>
            <input value={lotForm.lotNumber || ''} onChange={e => setLotForm(f => ({ ...f, lotNumber: e.target.value }))}
              placeholder="e.g. LOT-2024-001" className="mt-1 w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-indigo-300" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Yarn Type *</label>
            <select value={lotForm.type || 'COTTON'} onChange={e => setLotForm(f => ({ ...f, type: e.target.value as any }))}
              className="mt-1 w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-indigo-300">
              {YARN_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Count</label>
            <select value={lotForm.count || '30s'} onChange={e => setLotForm(f => ({ ...f, count: e.target.value }))}
              className="mt-1 w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-indigo-300">
              {YARN_COUNTS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Twist Direction</label>
            <select value={lotForm.twist || 'S-Twist'} onChange={e => setLotForm(f => ({ ...f, twist: e.target.value }))}
              className="mt-1 w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-indigo-300">
              {TWIST_DIRS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Received Qty (kg) *</label>
            <input type="number" value={lotForm.receivedQty || ''} onChange={e => setLotForm(f => ({ ...f, receivedQty: Number(e.target.value), currentQty: Number(e.target.value) }))}
              className="mt-1 w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-indigo-300" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Current Qty (kg)</label>
            <input type="number" value={lotForm.currentQty || ''} onChange={e => setLotForm(f => ({ ...f, currentQty: Number(e.target.value) }))}
              className="mt-1 w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-indigo-300" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Price per kg ({currency})</label>
            <input type="number" value={lotForm.pricePerKg || ''} onChange={e => setLotForm(f => ({ ...f, pricePerKg: Number(e.target.value) }))}
              className="mt-1 w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-indigo-300" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Shade/Color</label>
            <input value={lotForm.shade || ''} onChange={e => setLotForm(f => ({ ...f, shade: e.target.value }))} placeholder="e.g. Off-White, Navy Blue"
              className="mt-1 w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-indigo-300" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Supplier Name</label>
            <input value={lotForm.supplierName || ''} onChange={e => setLotForm(f => ({ ...f, supplierName: e.target.value }))}
              className="mt-1 w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-indigo-300" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Received Date</label>
            <input type="date" value={lotForm.receivedDate || ''} onChange={e => setLotForm(f => ({ ...f, receivedDate: e.target.value }))}
              className="mt-1 w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-indigo-300" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</label>
            <select value={lotForm.status || 'AVAILABLE'} onChange={e => setLotForm(f => ({ ...f, status: e.target.value as any }))}
              className="mt-1 w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-indigo-300">
              {Object.keys(statusColor).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="col-span-2">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Godown / Location</label>
            <input value={lotForm.location || ''} onChange={e => setLotForm(f => ({ ...f, location: e.target.value }))} placeholder="e.g. Godown-A, Rack-3"
              className="mt-1 w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-indigo-300" />
          </div>
          <div className="col-span-2">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Notes / Test Report Ref</label>
            <textarea value={lotForm.notes || ''} onChange={e => setLotForm(f => ({ ...f, notes: e.target.value }))} rows={2}
              className="mt-1 w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-indigo-300 resize-none" />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100 dark:border-slate-700">
          <button onClick={() => { setIsLotModalOpen(false); setSelectedLot(null); }} className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700">Cancel</button>
          <button onClick={handleSaveLot} className="px-6 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-all">
            {selectedLot ? 'Update Lot' : 'Add Lot'}
          </button>
        </div>
      </BaseModal>

      {/* Blend Modal */}
      <BaseModal isOpen={isBlendModalOpen} onClose={() => setIsBlendModalOpen(false)} title="Create Yarn Blend Recipe">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Blend Name *</label>
              <input value={blendForm.name || ''} onChange={e => setBlendForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. PC 65/35"
                className="mt-1 w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-purple-300" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Target Count</label>
              <input value={blendForm.targetCount || ''} onChange={e => setBlendForm(f => ({ ...f, targetCount: e.target.value }))}
                className="mt-1 w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-purple-300" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Twist</label>
              <select value={blendForm.twist || 'S-Twist'} onChange={e => setBlendForm(f => ({ ...f, twist: e.target.value }))}
                className="mt-1 w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-purple-300">
                {TWIST_DIRS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Components</label>
              <button onClick={() => setBlendForm(f => ({ ...f, components: [...(f.components || []), { yarnType: 'COTTON', percentage: 0 }] }))}
                className="text-xs text-purple-600 hover:text-purple-700 font-medium">+ Add Component</button>
            </div>
            {(blendForm.components || []).map((comp, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <select value={comp.yarnType} onChange={e => { const c = [...(blendForm.components || [])]; c[i] = { ...c[i], yarnType: e.target.value }; setBlendForm(f => ({ ...f, components: c })); }}
                  className="flex-1 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-800 outline-none">
                  {YARN_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <input type="number" placeholder="%" value={comp.percentage || ''} onChange={e => { const c = [...(blendForm.components || [])]; c[i] = { ...c[i], percentage: Number(e.target.value) }; setBlendForm(f => ({ ...f, components: c })); }}
                  className="w-20 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-800 outline-none" />
                <button onClick={() => setBlendForm(f => ({ ...f, components: (f.components || []).filter((_, j) => j !== i) }))}
                  className="p-2 text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
            {(blendForm.components || []).length > 0 && (
              <p className={`text-xs mt-1 font-medium ${(blendForm.components || []).reduce((s, c) => s + c.percentage, 0) === 100 ? 'text-emerald-600' : 'text-amber-600'}`}>
                Total: {(blendForm.components || []).reduce((s, c) => s + c.percentage, 0)}% {(blendForm.components || []).reduce((s, c) => s + c.percentage, 0) !== 100 ? '(must = 100%)' : '✓'}
              </p>
            )}
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100 dark:border-slate-700">
          <button onClick={() => setIsBlendModalOpen(false)} className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700">Cancel</button>
          <button onClick={() => {
            const blend: YarnBlend = { ...blendForm, id: `BLD-${Date.now()}`, status: 'ACTIVE', updatedAt: new Date().toISOString() } as YarnBlend;
            onAddBlend(blend);
            setIsBlendModalOpen(false);
            setBlendForm({ name: '', components: [], status: 'ACTIVE' });
          }} className="px-6 py-2 bg-purple-600 text-white rounded-xl text-sm font-medium hover:bg-purple-700 transition-all">
            Save Blend
          </button>
        </div>
      </BaseModal>
    </div>
  );
};

export default YarnManagement;
